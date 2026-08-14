const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  activityDurationError,
  computeAndValidateDuration,
  formatActivities,
  formatDefaultActivityMessage,
} = require("../../utils/activitiesUtil.js");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  NUMBERS,
} = require("../../utils/constants.js");
const { formatTime } = require("../../utils/timeUtil.js");
const {
  executeTransferWithConfirmation,
  getConfirmationInfo,
  postTransferMessageAndLog,
} = require("../../utils/transferUtil.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { resolveRoleAndMemberIds } = require("../../utils/roleUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const { getAndValidateInput } = require("../../utils/validationUtil.js");
const { execute: rainAPI } = require("../../requests/rain.js");

const command = new SlashCommandBuilder()
  .setName(COMMAND_KEYS.RAIN)
  .setDescription(COMMAND_DESCRIPTIONS.RAIN)
  .setDMPermission(false)
  .addStringOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.INPUT)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.RAIN_INPUT)
      .setRequired(true)
      .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
  )
  .addIntegerOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.DURATION_DAYS)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.DAYS_ACTIVE)
      .setMinValue(0)
      .setMaxValue(NUMBERS.MAXIMUM_DAYS_ACTIVE),
  )
  .addIntegerOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.DURATION_HOURS)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.HOURS_ACTIVE)
      .setMinValue(0)
      .setMaxValue(NUMBERS.MAXIMUM_HOURS_ACTIVE),
  )
  .addIntegerOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.DURATION_MINUTES)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.MINUTES_ACTIVE)
      .setMinValue(0)
      .setMaxValue(NUMBERS.MAXIMUM_MINUTES_ACTIVE),
  )
  .addIntegerOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.RANDOM)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.USERS)
      .setMinValue(NUMBERS.MINIMUM_USERS_ACTIVE)
      .setMaxValue(NUMBERS.MAXIMUM_USERS_ACTIVE - 1),
  )
  .addIntegerOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.USERS)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.USERS)
      .setMinValue(NUMBERS.MINIMUM_USERS_ACTIVE)
      .setMaxValue(NUMBERS.MAXIMUM_USERS_ACTIVE),
  );

if (process.env.GUILD_INTENTS_GRANTED === "true") {
  command.addRoleOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.ROLE)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.ROLE)
      .setRequired(false),
  );
}

module.exports = {
  data: command,
  async execute(interaction, client) {
    try {
      const durationDays = interaction.options.getInteger(
        COMMAND_OPTION_KEYS.DURATION_DAYS,
      );
      const durationHours = interaction.options.getInteger(
        COMMAND_OPTION_KEYS.DURATION_HOURS,
      );
      const durationMinutes = interaction.options.getInteger(
        COMMAND_OPTION_KEYS.DURATION_MINUTES,
      );

      const { minutes: minutesActiveConfig, error: durationError } =
        computeAndValidateDuration(
          durationDays,
          durationHours,
          durationMinutes,
          NUMBERS.MINIMUM_MINUTES_ACTIVE,
          NUMBERS.MAXIMUM_MINUTES_ACTIVE,
          activityDurationError,
          COMMAND_KEYS.RAIN,
        );

      if (durationError) {
        return await interaction.editReply({
          embeds: [buildEmbed({ ...durationError, error: true })],
        });
      }

      const random =
        interaction.options.getInteger(COMMAND_OPTION_KEYS.RANDOM) || 0;
      const users =
        interaction.options.getInteger(COMMAND_OPTION_KEYS.USERS) || 0;
      const { guildId, channelId, userId } =
        getInteractionContext(interaction);
      let roleId =
        interaction.options.getRole(COMMAND_OPTION_KEYS.ROLE)?.id ?? "0";

      let userIdsWithRole = null;
      if (roleId !== "0") {
        const result = await resolveRoleAndMemberIds(
          interaction,
          roleId,
          COMMAND_KEYS.RAIN,
          { excludeIssuer: true, normalizeGuildId: true },
        );
        if (!result) return;
        userIdsWithRole = result.userIdsWithRole;
      }

      let description = "";
      if (minutesActiveConfig > 0)
        description += `(**last ${EMOJIS.TIMESTAMP_HOURGLASS} ${formatTime(
          minutesActiveConfig,
        )}**) `;
      if (isValidString(roleId))
        description += `(**<@&${roleId}> ${EMOJIS.ROLES_MASKS} role**) `;
      if (users > 0) {
        description += `(**${users} ${EMOJIS.MAN_RUNNING} ${users === 1 ? "user" : "users"
          }**) `;
      }

      if (random > 0) {
        description += `(**${random} ${EMOJIS.RANDOM_DICE} ${random === 1 ? "random" : "randoms"
          }**) `;
      }
      description = description.trim();

      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.RAIN_CLOUD,
        interaction.user.username,
        COMMAND_KEYS.RAIN,
      );

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.RAIN,
      );
      if (input === null) return;

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) =>
          rainAPI(
            guildId,
            channelId,
            userId,
            confirmed,
            minutesActiveConfig,
            input,
            random,
            userIdsWithRole,
            users,
            roleId,
          ),
        statusCommandKey: COMMAND_KEYS.RAIN,
        confirmCommandKey: COMMAND_KEYS.RAIN,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.RAIN,
            address: null,
            isComplete: false,
            optional: "",
            items: res.data.primaryTransfer.items,
            wallets: res.data.primaryTransfer.wallets,
            creatures: res.data.creatures,
            commands: res.data.commands,
            bonuses: res.data.bonuses,
            currencies: res.data.currencies,
            drop: res.data.drop,
            displayTimestamp: false,
            title: EMBED_TITLE,
            url: null,
            includeNotes: false,
            transactionId: null,
          }),
      });

      if (!response) return;

      if (
        response.data.activities == null ||
        response.data.activities?.length < 1
      ) {
        const EMBED_CONTENT = formatActivities(
          response.data.activities,
          response.data.guildConfigurations.maximumMinutesActive,
          response.data.guildConfigurations.maximumActiveUsers,
          minutesActiveConfig,
          users,
          random,
          roleId,
          channelId,
          response.data.commands,
          formatDefaultActivityMessage(response.data.commands),
        );

        return await interaction.editReply({
          embeds: [
            buildEmbed({
              color: COLORS.NANOBOT_BLUE,
              title: EMOJIS.MAN_RUNNING + " " + COMMAND_DESCRIPTIONS.ACTIVE,
              description: EMBED_CONTENT,
            }),
          ],
          components: [],
          ephemeral: true,
        });
      }

      await postTransferMessageAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.RAIN,
        emoji: EMOJIS.RAIN_CLOUD,
        response,
        input,
        getRecipientInfo: (transferInfo) => ({
          emoji: EMOJIS.SUBORDINATE,
          title: "Recipients",
          description: transferInfo.transferUser,
        }),
        drop: response.data.drop,
        embedTitle: EMBED_TITLE,
        getTransferUserSuffix: (transferInfo) =>
          `to ${transferInfo.transferUser} ${description}`,
        eachFlag: true,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.RAIN, err);
    }
  },
};
