const { PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatServerMessage } = require("../../utils/aliasesUtil.js");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  NUMBERS,
  STATUS_CODES,
  TIME,
} = require("../../utils/constants.js");
const {
  catchCommandException,
  formatErrorTitle,
} = require("../../utils/errorUtil.js");
const { checkStatuses } = require("../../utils/statusUtil.js");
const { formatConfigurationsMessage } = require("../../utils/serverUtil.js");
const { formatTime } = require("../../utils/timeUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { isValidEmoji } = require("../../utils/emojiUtil.js");
const { execute: configAPI } = require("../../requests/config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.CONFIG)
    .setDescription(COMMAND_DESCRIPTIONS.CONFIG)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.ACTIVITY_DURATION)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_ACTIVITY_DURATION)
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.DURATION_DAYS)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.DAYS)
            .setMinValue(NUMBERS.MINIMUM_DAYS_ACTIVE)
            .setMaxValue(NUMBERS.MAXIMUM_DAYS_ACTIVE),
        )
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.DURATION_HOURS)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.HOURS)
            .setMinValue(NUMBERS.MINIMUM_HOURS_ACTIVE)
            .setMaxValue(NUMBERS.MAXIMUM_HOURS_ACTIVE),
        )
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.DURATION_MINUTES)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.MINUTES)
            .setMinValue(NUMBERS.MINIMUM_MINUTES_ACTIVE)
            .setMaxValue(NUMBERS.MAXIMUM_MINUTES_ACTIVE),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.ADD_ALIAS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_ADD_ALIAS)
        .addStringOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.ALIAS_SINGULAR)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.ALIAS)
            .setRequired(true)
            .setMaxLength(NUMBERS.MAXIMUM_ALIAS_LENGTH),
        )
        .addStringOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.ALIAS_PLURAL)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.ALIAS)
            .setRequired(true)
            .setMaxLength(NUMBERS.MAXIMUM_ALIAS_LENGTH),
        )
        .addStringOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.ALIAS_VALUE)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.ALIAS_INPUT)
            .setRequired(true)
            .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
        )
        .addStringOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.ALIAS_EMOJI)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.EMOJI)
            .setRequired(true)
            .setMaxLength(NUMBERS.MAXIMUM_ALIAS_LENGTH),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.FISHING_BYPASS_ROLE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_FISHING_BYPASS_ROLE)
        .addRoleOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.FISHING_BYPASS_ROLE)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.ROLE)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.FISHING_ERROR_MESSAGE)
        .setDescription(
          COMMAND_OPTION_DESCRIPTIONS.CONFIG_FISHING_ERROR_MESSAGE,
        )
        .addStringOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.FISHING_ERROR_MESSAGE)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.STRING)
            .setRequired(false)
            .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.FISHING_CHANNEL)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_FISHING_CHANNEL)
        .addChannelOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.FISHING_CHANNEL)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.CHANNEL)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.FISHING_FREQUENCY)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_FISHING_FREQUENCY)
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.DURATION_DAYS)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.DAYS)
            .setMinValue(NUMBERS.MINIMUM_DAYS_FISHING)
            .setMaxValue(NUMBERS.MAXIMUM_DAYS_FISHING),
        )
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.DURATION_HOURS)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.HOURS)
            .setMinValue(NUMBERS.MINIMUM_HOURS_FISHING)
            .setMaxValue(NUMBERS.MAXIMUM_HOURS_FISHING),
        )
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.DURATION_MINUTES)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.MINUTES)
            .setMinValue(NUMBERS.MINIMUM_MINUTES_FISHING)
            .setMaxValue(NUMBERS.MAXIMUM_MINUTES_FISHING),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.FISHING_ROLE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_FISHING_ROLE)
        .addRoleOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.FISHING_ROLE)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.ROLE)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.FISHING_LOGGING_CHANNEL)
        .setDescription(
          COMMAND_OPTION_DESCRIPTIONS.CONFIG_FISHING_LOGGING_CHANNEL,
        )
        .addChannelOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.FISHING_LOGGING_CHANNEL)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.CHANNEL)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.TRANSFER_LOGGING_CHANNEL)
        .setDescription(
          COMMAND_OPTION_DESCRIPTIONS.CONFIG_TRANSFER_LOGGING_CHANNEL,
        )
        .addChannelOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.TRANSFER_LOGGING_CHANNEL)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.CHANNEL)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.REMOVE_ALIAS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_REMOVE_ALIAS)
        .addStringOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.ALIAS_SINGULAR)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.ALIAS)
            .setRequired(true)
            .setMaxLength(NUMBERS.MAXIMUM_ALIAS_LENGTH),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.USERS_ACTIVE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CONFIG_USERS_ACTIVE)
        .addIntegerOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.USERS_ACTIVE)
            .setRequired(false)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.USERS)
            .setMinValue(NUMBERS.MINIMUM_USERS_ACTIVE)
            .setMaxValue(NUMBERS.MAXIMUM_USERS_ACTIVE),
        ),
    ),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.CONFIG_WRENCH,
        interaction.user.username,
        COMMAND_KEYS.CONFIG,
      );

      const { guildId, userId } = getInteractionContext(interaction);

      if (
        !interaction.memberPermissions?.has(
          PermissionsBitField.Flags.Administrator,
        )
      ) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.CONFIG),
              description:
                "<@" +
                userId +
                ">, " +
                "you must be a server administrator to use this command.",
              error: true,
            }),
          ],
        });
      }

      const guildTemplate = {
        guildId: guildId,
        userId: userId,
        fishingChannelId: null,
        fishingError: null,
        fishingFrequency: null,
        fishingLoggingChannelId: null,
        fishingRole: null,
        fishingBypassRoles: null,
        maximumActiveUsers: null,
        maximumMinutesActive: null,
        transferLoggingChannelId: null,
        aliasData: null,
      };

      const getCommandEmbed = (response, embedContent, footerFlag) => {
        return {
          embeds: [
            buildEmbed({
              color: COLORS.NANOBOT_BLUE,
              title: EMBED_TITLE,
              description:
                embedContent +
                `\n\n` +
                (footerFlag
                  ? formatConfigurationsMessage(response.data.commands)
                  : formatServerMessage(response.data.commands)),
            }),
          ],
        };
      };

      const handleValidationError = async (errorMsg) => {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.CONFIG),
              description: errorMsg,
              error: true,
            }),
          ],
        });
      };

      const sendAndRespond = async (
        guildTemplate,
        embedContent,
        footerFlag,
      ) => {
        const response = await configAPI(guildTemplate);
        if (
          !(await checkStatuses(
            interaction,
            response,
            STATUS_CODES.ACCEPTED,
            COMMAND_KEYS.CONFIG,
          ))
        )
          return;

        await interaction.editReply(
          getCommandEmbed(response, embedContent, footerFlag),
        );
      };

      const optionHandlers = {
        add_alias: async () => {
          let aliasSingular =
            interaction.options
              .getString(COMMAND_OPTION_KEYS.ALIAS_SINGULAR)
              ?.trim() || null;
          let aliasPlural =
            interaction.options
              .getString(COMMAND_OPTION_KEYS.ALIAS_PLURAL)
              ?.trim() || null;
          const aliasValue =
            interaction.options.getString(COMMAND_OPTION_KEYS.ALIAS_VALUE) ||
            null;
          let aliasEmoji =
            interaction.options
              .getString(COMMAND_OPTION_KEYS.ALIAS_EMOJI)
              ?.trim() || null;

          if (
            aliasSingular.includes(" ") ||
            aliasSingular.length > NUMBERS.MAXIMUM_ALIAS_LENGTH
          ) {
            return handleValidationError(
              `Alias (Singular) must be a single word, no longer than ${NUMBERS.MAXIMUM_ALIAS_LENGTH} characters!`,
            );
          }
          if (
            aliasPlural.includes(" ") ||
            aliasPlural.length > NUMBERS.MAXIMUM_ALIAS_LENGTH
          ) {
            return handleValidationError(
              `Alias (Plural) must be a single word, no longer than ${NUMBERS.MAXIMUM_ALIAS_LENGTH} characters!`,
            );
          }
          if (
            aliasEmoji.includes(" ") ||
            aliasEmoji.length > NUMBERS.MAXIMUM_ALIAS_LENGTH ||
            !isValidEmoji(aliasEmoji)
          ) {
            return handleValidationError(`Invalid Emoji: ${aliasEmoji}`);
          }
          if (aliasValue != null && aliasValue.includes("+")) {
            return handleValidationError(
              "Alias value cannot combine amounts with `+`. Use a single amount, such as `$2 ban` or `.1 nano`.",
            );
          }

          guildTemplate.aliasData = {
            singular: aliasSingular,
            plural: aliasPlural,
            value: aliasValue,
            emoji: aliasEmoji,
          };
          await sendAndRespond(
            guildTemplate,
            `You successfully added the alias ${aliasSingular.toUpperCase()} (${aliasPlural.toUpperCase()})!\n` +
              `Now this alias can be used in your server.`,
            false,
          );
        },

        remove_alias: async () => {
          let aliasName =
            interaction.options
              .getString(COMMAND_OPTION_KEYS.ALIAS_SINGULAR)
              ?.trim() || null;
          if (
            aliasName.includes(" ") ||
            aliasName.length > NUMBERS.MAXIMUM_ALIAS_LENGTH
          ) {
            return handleValidationError(
              `Alias must be a single word, no longer than ${NUMBERS.MAXIMUM_ALIAS_LENGTH} characters!`,
            );
          }
          guildTemplate.aliasData = { singular: aliasName };
          await sendAndRespond(
            guildTemplate,
            `You successfully removed the alias ${aliasName.toUpperCase()}!\n` +
              `Now this alias cannot be used in your server.`,
            false,
          );
        },

        fishing_channel: async () => {
          const channelConfig = interaction.options.getChannel(
            COMMAND_OPTION_KEYS.FISHING_CHANNEL,
          );
          guildTemplate.fishingChannelId = channelConfig
            ? channelConfig.id
            : "0";
          const embedContent =
            guildTemplate.fishingChannelId === "0"
              ? `You successfully cleared the fishing channel configuration.\n` +
                `Now completed catches and cooldown notification messages will not be sent in your server. (Default)`
              : `You successfully set the fishing channel to <#${guildTemplate.fishingChannelId}>!\n` +
                `Now completed catches and cooldown notification messages will be sent in that channel.`;
          await sendAndRespond(guildTemplate, embedContent, true);
        },

        fishing_error_message: async () => {
          const errorMessage =
            interaction.options.getString(
              COMMAND_OPTION_KEYS.FISHING_ERROR_MESSAGE,
            ) || null;
          if (
            errorMessage &&
            errorMessage.length > NUMBERS.MAXIMUM_INPUT_LENGTH
          ) {
            return handleValidationError(
              "Invalid Input: The input is too long! Please limit it to " +
                NUMBERS.MAXIMUM_INPUT_LENGTH +
                " characters.",
            );
          }
          guildTemplate.fishingError = errorMessage || "";
          const embedContent = errorMessage
            ? `You successfully set the fishing error message to \`${errorMessage}\`\n` +
              `Now this error message will be displayed to users that do not hold the required fishing role.`
            : `You successfully cleared the fishing error message configuration.\n` +
              `Now the generic message will be displayed to users that do not hold the required fishing role. (Default)`;
          await sendAndRespond(guildTemplate, embedContent, true);
        },

        fishing_frequency: async () => {
          let frequencyConfigMinutes =
            (interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_DAYS,
            ) || 0) * TIME.MINUTES_PER_DAY;
          frequencyConfigMinutes +=
            (interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_HOURS,
            ) || 0) * TIME.MINUTES_PER_HOUR;
          frequencyConfigMinutes +=
            interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_MINUTES,
            ) || 0;

          if (
            frequencyConfigMinutes < NUMBERS.MINIMUM_FISHING_FREQUENCY &&
            (interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_DAYS,
            ) != null ||
              interaction.options.getInteger(
                COMMAND_OPTION_KEYS.DURATION_HOURS,
              ) != null ||
              interaction.options.getInteger(
                COMMAND_OPTION_KEYS.DURATION_MINUTES,
              ) != null)
          ) {
            return handleValidationError(
              "Fishing Frequency must be at least " +
                NUMBERS.MINIMUM_FISHING_FREQUENCY +
                " minutes!",
            );
          }
          guildTemplate.fishingFrequency = frequencyConfigMinutes;
          await sendAndRespond(
            guildTemplate,
            `You successfully set the fishing frequency to **${
              frequencyConfigMinutes !== 0
                ? `${formatTime(frequencyConfigMinutes)}**`
                : `${formatTime(NUMBERS.DEFAULT_FISHING_FREQUENCY)}** (Default)`
            }.\n` +
              `Now users will be required to wait this long between fishing catches.`,
            true,
          );
        },

        fishing_role: async () => {
          const role = interaction.options.getRole(
            COMMAND_OPTION_KEYS.FISHING_ROLE,
          );
          guildTemplate.fishingRole =
            role?.id && role.id !== guildId ? role.id : "0";
          const embedContent =
            guildTemplate.fishingRole === "0"
              ? `You successfully cleared the fishing role requirement.\n` +
                `Now everyone in this server can fish. (Default)`
              : `You successfully set the required fishing role to <@&${role.id}>!\n` +
                `Now only users holding this role can fish in this server.`;
          await sendAndRespond(guildTemplate, embedContent, true);
        },

        fishing_bypass_role: async () => {
          const role = interaction.options.getRole(
            COMMAND_OPTION_KEYS.FISHING_BYPASS_ROLE,
          );
          guildTemplate.fishingBypassRoles =
            role?.id && role.id !== guildId ? [role.id] : ["0"];
          const embedContent =
            guildTemplate.fishingBypassRoles[0] === "0"
              ? `You successfully cleared the fishing bypass roles.\n` +
                `Now nobody can bypass the required fishing role requirement. (Default)`
              : `You successfully added <@&${role.id}> as a fishing bypass role.\n` +
                `Now everyone in this server holding this role can fish.`;
          await sendAndRespond(guildTemplate, embedContent, true);
        },

        fishing_logging_channel: async () => {
          const channelConfig = interaction.options.getChannel(
            COMMAND_OPTION_KEYS.FISHING_LOGGING_CHANNEL,
          );
          guildTemplate.fishingLoggingChannelId = channelConfig
            ? channelConfig.id
            : "0";
          const embedContent =
            guildTemplate.fishingLoggingChannelId === "0"
              ? `You successfully cleared the fishing logging channel.\n` +
                `Now fishing catches will not be logged. (Default)`
              : `You successfully set the fishing logging channel to <#${guildTemplate.fishingLoggingChannelId}>!\n` +
                `Now fishing catches will be logged.`;
          await sendAndRespond(guildTemplate, embedContent, true);
        },

        transfer_logging_channel: async () => {
          const channelConfig = interaction.options.getChannel(
            COMMAND_OPTION_KEYS.TRANSFER_LOGGING_CHANNEL,
          );
          guildTemplate.transferLoggingChannelId = channelConfig
            ? channelConfig.id
            : "0";
          const embedContent =
            guildTemplate.transferLoggingChannelId === "0"
              ? `You successfully cleared the logging channel.\n` +
                `Now server transactions will not be logged. (Default)`
              : `You successfully set the transfer logging channel to <#${guildTemplate.transferLoggingChannelId}>!\n` +
                `Now server transactions will be logged.`;
          await sendAndRespond(guildTemplate, embedContent, true);
        },

        activity_duration: async () => {
          let minutesActiveConfig =
            (interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_DAYS,
            ) || 0) * TIME.MINUTES_PER_DAY;
          minutesActiveConfig +=
            (interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_HOURS,
            ) || 0) * TIME.MINUTES_PER_HOUR;
          minutesActiveConfig +=
            interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_MINUTES,
            ) || 0;

          if (
            minutesActiveConfig < NUMBERS.MINIMUM_MINUTES_ACTIVE &&
            (interaction.options.getInteger(
              COMMAND_OPTION_KEYS.DURATION_DAYS,
            ) != null ||
              interaction.options.getInteger(
                COMMAND_OPTION_KEYS.DURATION_HOURS,
              ) != null ||
              interaction.options.getInteger(
                COMMAND_OPTION_KEYS.DURATION_MINUTES,
              ) != null)
          ) {
            return handleValidationError(
              "Invalid Duration: Activity must be at least " +
                NUMBERS.MINIMUM_MINUTES_ACTIVE +
                (NUMBERS.MINIMUM_MINUTES_ACTIVE !== 1
                  ? " minutes"
                  : " minute") +
                " in total.",
            );
          }
          if (minutesActiveConfig > NUMBERS.MAXIMUM_MINUTES_ACTIVE) {
            return handleValidationError(
              "Invalid Duration: Activity cannot exceed " +
                NUMBERS.MAXIMUM_DAYS_ACTIVE +
                (NUMBERS.MAXIMUM_DAYS_ACTIVE !== 1 ? " day, " : " days, ") +
                NUMBERS.MAXIMUM_HOURS_ACTIVE +
                (NUMBERS.MAXIMUM_HOURS_ACTIVE !== 1
                  ? " hours, or "
                  : " hour, or ") +
                NUMBERS.MAXIMUM_MINUTES_ACTIVE +
                (NUMBERS.MAXIMUM_MINUTES_ACTIVE !== 1
                  ? " minutes in total."
                  : " minute in total."),
            );
          }

          guildTemplate.maximumMinutesActive = minutesActiveConfig;
          await sendAndRespond(
            guildTemplate,
            `You successfully set the activity duration to **${
              minutesActiveConfig !== 0
                ? `${formatTime(minutesActiveConfig)}**`
                : `${formatTime(NUMBERS.DEFAULT_MINUTES_ACTIVE)}** (Default)`
            }.\n` +
              `Now users will be active in each channel for this duration.`,
            true,
          );
        },

        users_active: async () => {
          const usersActiveConfig =
            interaction.options.getInteger(COMMAND_OPTION_KEYS.USERS_ACTIVE) ||
            0;
          guildTemplate.maximumActiveUsers = usersActiveConfig;
          await sendAndRespond(
            guildTemplate,
            `You successfully set the maximum active users to **${
              usersActiveConfig !== 0
                ? `${usersActiveConfig}**`
                : `${NUMBERS.DEFAULT_USERS_ACTIVE}** (Default)`
            }.\n` +
              `Now this is the maximum number of users in each channel that can be active.`,
            true,
          );
        },
      };

      const chosenSubcommand = interaction.options.getSubcommand();
      if (chosenSubcommand in optionHandlers) {
        await optionHandlers[chosenSubcommand]();
      }
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.CONFIG,
        err,
      );
    }
  },
};
