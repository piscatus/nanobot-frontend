const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  NUMBERS,
} = require("../../utils/constants.js");
const { executeWithStatusCheck } = require("../../utils/statusUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const {
  activityDurationError,
  buildActiveEmbed,
  computeAndValidateDuration,
} = require("../../utils/activitiesUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { resolveRoleAndMemberIds } = require("../../utils/roleUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { execute: activeAPI } = require("../../requests/active.js");

const command = new SlashCommandBuilder()
  .setName(COMMAND_KEYS.ACTIVE)
  .setDescription(COMMAND_DESCRIPTIONS.ACTIVE)
  .setDMPermission(false)
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
      .setName(COMMAND_OPTION_KEYS.DURATION_HOURS)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.HOURS_ACTIVE)
      .setMinValue(0)
      .setMaxValue(NUMBERS.MAXIMUM_HOURS_ACTIVE),
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
      .setName(COMMAND_OPTION_KEYS.USERS)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.USERS)
      .setMinValue(NUMBERS.MINIMUM_USERS_ACTIVE)
      .setMaxValue(NUMBERS.MAXIMUM_USERS_ACTIVE),
  )
  .addIntegerOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.RANDOM)
      .setRequired(false)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.RANDOM)
      .setMinValue(NUMBERS.MINIMUM_USERS_ACTIVE)
      .setMaxValue(NUMBERS.MAXIMUM_USERS_ACTIVE - 1),
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
          COMMAND_KEYS.ACTIVE,
        );

      if (durationError) {
        return await interaction.editReply({
          embeds: [buildEmbed({ ...durationError, error: true })],
        });
      }

      const { guildId, channelId, userId } =
        getInteractionContext(interaction);
      const random =
        interaction.options.getInteger(COMMAND_OPTION_KEYS.RANDOM) || 0;
      const users =
        interaction.options.getInteger(COMMAND_OPTION_KEYS.USERS) || 0;
      let roleId =
        interaction.options.getRole(COMMAND_OPTION_KEYS.ROLE)?.id ?? "0";

      let userIdsWithRole = null;
      if (isValidString(roleId)) {
        const result = await resolveRoleAndMemberIds(
          interaction,
          roleId,
          COMMAND_KEYS.ACTIVE,
          { normalizeGuildId: true },
        );
        if (!result) return;
        userIdsWithRole = result.userIdsWithRole;
      }

      const response = await executeWithStatusCheck(
        interaction,
        () =>
          activeAPI(
            guildId,
            channelId,
            userId,
            minutesActiveConfig,
            random,
            users,
            userIdsWithRole,
          ),
        COMMAND_KEYS.ACTIVE,
      );
      if (!response) return;

      const embed = buildActiveEmbed(response.data, {
        minutesActiveConfig,
        users,
        random,
        roleId,
        channelId,
      });

      return await interaction.editReply({
        embeds: [embed],
      });
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.ACTIVE,
        err,
      );
    }
  },
};
