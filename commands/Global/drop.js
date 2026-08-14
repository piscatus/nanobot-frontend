const { SlashCommandBuilder } = require("@discordjs/builders");
const { computeAndValidateDuration } = require("../../utils/activitiesUtil.js");
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
const { dropDurationError } = require("../../utils/timeUtil.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const {
  catchCommandException,
  catchMessageException,
  formatErrorTitle,
} = require("../../utils/errorUtil.js");
const {
  deleteMessage,
  editEmbed,
  sendEmbed,
} = require("../../utils/channelUtil.js");
const {
  buildCriteriaList,
  executeTransferWithConfirmation,
  getConfirmationInfo,
  getTransferInfo,
} = require("../../utils/transferUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const {
  getAndValidateInput,
  validateNumericOption,
} = require("../../utils/validationUtil.js");
const { execute: dropAPI } = require("../../requests/drop.js");
const { execute: dropUpdateAPI } = require("../../requests/dropUpdate.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.DROP)
    .setDescription(COMMAND_DESCRIPTIONS.DROP)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.INPUT)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.DROP_INPUT)
        .setRequired(true)
        .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
    )
    .addIntegerOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.DURATION_DAYS)
        .setRequired(false)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.DAYS)
        .setMinValue(NUMBERS.MINIMUM_DAYS_DROP)
        .setMaxValue(NUMBERS.MAXIMUM_DAYS_DROP),
    )
    .addIntegerOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.DURATION_HOURS)
        .setRequired(false)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.HOURS)
        .setMinValue(NUMBERS.MINIMUM_HOURS_DROP)
        .setMaxValue(NUMBERS.MAXIMUM_HOURS_DROP),
    )
    .addIntegerOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.DURATION_MINUTES)
        .setRequired(false)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MINUTES)
        .setMinValue(NUMBERS.MINIMUM_MINUTES_DROP)
        .setMaxValue(NUMBERS.MAXIMUM_MINUTES_DROP),
    )
    .addNumberOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.RANDOM)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.RANDOM)
        .setRequired(false)
        .setMinValue(NUMBERS.MINIMUM_USERS_RANDOM)
        .setMaxValue(NUMBERS.MAXIMUM_USERS_RANDOM),
    )
    .addRoleOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.ROLE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.ROLE)
        .setRequired(false),
    )
    .addNumberOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.USERS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.USERS)
        .setRequired(false)
        .setMinValue(NUMBERS.MINIMUM_USERS_DROP)
        .setMaxValue(NUMBERS.MAXIMUM_USERS_DROP),
    ),
  async execute(interaction, client) {
    let message = null;
    let channelId = null;
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
          NUMBERS.MINIMUM_MINUTES_DROP,
          NUMBERS.MAXIMUM_MINUTES_DROP,
          dropDurationError,
          COMMAND_KEYS.DROP,
        );

      if (durationError) {
        return await interaction.editReply({
          embeds: [buildEmbed({ ...durationError, error: true })],
        });
      }

      const context = getInteractionContext(interaction);
      channelId = context.channelId;
      const { guildId, userId } = context;
      const role = interaction.options.getRole(COMMAND_OPTION_KEYS.ROLE);
      const roleId =
        role?.id && isValidString(role.id) && role.id !== guildId
          ? role.id
          : "0";

      const usersResult = await validateNumericOption(
        interaction,
        interaction.options.getNumber(COMMAND_OPTION_KEYS.USERS),
        {
          min: NUMBERS.MINIMUM_USERS_DROP,
          max: NUMBERS.MAXIMUM_USERS_DROP,
          commandKey: COMMAND_KEYS.DROP,
          fieldName: "The number of users",
          maxDescription:
            "Drops cannot specify more than " +
            NUMBERS.MAXIMUM_USERS_DROP +
            " users!",
          minDescription:
            "The number of users must be at least " +
            NUMBERS.MINIMUM_USERS_DROP +
            "!",
          wholeNumberDescription: "The number of users must be a whole number!",
          defaultValue: 0,
        },
      );
      if (usersResult === null) return;
      const users = usersResult;

      const winnersResult = await validateNumericOption(
        interaction,
        interaction.options.getNumber(COMMAND_OPTION_KEYS.RANDOM),
        {
          min: NUMBERS.MINIMUM_USERS_RANDOM,
          max: NUMBERS.MAXIMUM_USERS_RANDOM,
          commandKey: COMMAND_KEYS.DROP,
          fieldName: "The number of winners",
          maxDescription:
            "Drops cannot specify more than " +
            NUMBERS.MAXIMUM_USERS_RANDOM +
            " winners!",
          minDescription:
            "The number of winners must be at least " +
            NUMBERS.MINIMUM_USERS_RANDOM +
            "!",
          wholeNumberDescription:
            "The number of winners must be a whole number!",
          defaultValue: 0,
        },
      );
      if (winnersResult === null) return;
      const winners = winnersResult;
      if (winners !== 0 && users !== 0 && winners >= users) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.DROP),
              description:
                "Please, do not specify a random number that is geater than or equal to the specified number of users!",
              error: true,
            }),
          ],
        });
      }

      if (roleId !== "0" && channelId === process.env.AIRDROPS_CHANNEL_ID) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.DROP),
              description:
                "Please, do not add role requirements to drops in <#" +
                process.env.AIRDROPS_CHANNEL_ID +
                ">, these should be open to all <@&" +
                process.env.HOME_SERVER_VIP_ROLE_ID +
                ">'s!",
              error: true,
            }),
          ],
        });
      }

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.DROP,
      );
      if (input === null) return;

      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.WATER_DROP,
        interaction.user.username,
        COMMAND_KEYS.DROP,
      );

      let response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) =>
          dropAPI(
            guildId,
            channelId,
            userId,
            minutesActiveConfig,
            roleId,
            users,
            winners,
            confirmed,
            input,
          ),
        statusCommandKey: COMMAND_KEYS.DROP,
        confirmCommandKey: COMMAND_KEYS.DROP,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input: null,
            command: COMMAND_KEYS.DROP,
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

      const {
        aliases,
        primaryTransfer,
        completedPrimaryTransfers,
        currencies,
        creatures,
        drop,
        guildConfigurations,
        transactionId,
      } = response.data;

      let customColor = COLORS.NANOBOT_BLUE;
      if (
        primaryTransfer.wallets.length == 1 &&
        primaryTransfer.items.length == 0
      ) {
        const currencyMap = new Map(currencies.map((c) => [c.ticker, c]));
        const currency = currencyMap.get(primaryTransfer.wallets[0].ticker);
        customColor = currency.color;
      }

      const transferInfo = getTransferInfo(
        userId,
        COMMAND_KEYS.DROP,
        completedPrimaryTransfers,
        aliases,
        response.data.bonuses,
        response.data.commands,
        currencies,
        creatures,
        false,
      );

      const prefinalMessage =
        `${transferInfo.transferMessage} ` +
        `${EMOJIS.WATER_DROP} ` +
        `to transfer ` +
        `**${input}**`;

      const postfinalMessage =
        `${transferInfo.transferEmojis}` +
        `${transferInfo.transferValue} ` +
        `${transferInfo.transferDollarValue}`;

      const finalMessage = prefinalMessage + "\n" + postfinalMessage;

      const finalEmbed = buildEmbed({
        color: customColor,
        title: EMOJIS.WATER_DROP + " A drop appears!",
        description: finalMessage,
        fields: buildCriteriaList(drop, true),
      });

      const pickupButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pickup")
          .setLabel("Join Drop")
          .setEmoji(EMOJIS.JOIN_DROP)
          .setStyle(ButtonStyle.Primary),
      );

      message = await sendEmbed(
        client,
        COMMAND_KEYS.DROP,
        channelId,
        finalEmbed,
        [],
      );

      const completedTransfer = Object.values(completedPrimaryTransfers)[0];
      const receiptEmbed = getConfirmationInfo({
        userId,
        input,
        command: COMMAND_KEYS.DROP,
        address: null,
        isComplete: true,
        optional: "",
        items: completedTransfer.items,
        wallets: completedTransfer.wallets,
        creatures: response.data.creatures,
        commands: response.data.commands,
        bonuses: response.data.bonuses,
        currencies: response.data.currencies,
        drop: response.data.drop,
        displayTimestamp: true,
        title: EMBED_TITLE,
        url: null,
        includeNotes: true,
        transactionId,
      });

      let logEmbed = null;
      if (message !== undefined && isValidString(message.id)) {
        const updateResponse = await dropUpdateAPI(
          drop.id,
          message.id,
          postfinalMessage,
        );

        if (updateResponse.data.errorMessage != null) {
          await deleteMessage(client, COMMAND_KEYS.DROP, channelId, message.id);

          await interaction.editReply({
            embeds: [
              buildEmbed({
                title: formatErrorTitle(COMMAND_KEYS.DROP),
                description:
                  "The bot was unable to update the drop with the message ID.\n" +
                  "The dropped funds will be returned to you when the drop has ended, sorry for the inconvenience!",
                error: true,
              }),
            ],
            components: [],
          });
        } else {
          await editEmbed(
            client,
            COMMAND_KEYS.DROP,
            channelId,
            finalEmbed,
            [pickupButton],
            message.id,
          );

          await interaction.editReply({
            embeds: [receiptEmbed],
            components: [],
          });

          logEmbed = getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.DROP,
            address: null,
            isComplete: true,
            optional: "",
            items: completedTransfer.items,
            wallets: completedTransfer.wallets,
            creatures: response.data.creatures,
            commands: response.data.commands,
            bonuses: response.data.bonuses,
            currencies: response.data.currencies,
            drop: response.data.drop,
            displayTimestamp: true,
            title: EMBED_TITLE,
            url: `https://discord.com/channels/${guildId}/${channelId}/${message.id}`,
            includeNotes: false,
            transactionId,
          });
        }
      } else {
        await catchMessageException(interaction, COMMAND_KEYS.DROP);
        logEmbed = getConfirmationInfo({
          userId,
          input,
          command: COMMAND_KEYS.DROP,
          address: null,
          isComplete: true,
          optional: "",
          items: completedTransfer.items,
          wallets: completedTransfer.wallets,
          creatures: response.data.creatures,
          commands: response.data.commands,
          bonuses: response.data.bonuses,
          currencies: response.data.currencies,
          drop: response.data.drop,
          displayTimestamp: true,
          title: EMBED_TITLE,
          url: null,
          includeNotes: false,
          transactionId,
        });
      }

      const systemLoggingChannelId =
        process.env.TRANSFER_LOGGING_CHANNEL_ID ?? null;

      if (isValidString(systemLoggingChannelId)) {
        try {
          sendEmbed(
            client,
            COMMAND_KEYS.DROP,
            systemLoggingChannelId,
            logEmbed,
            [],
          );
        } catch (e) {
          console.log(finalMessage);
          console.error(e);
        }
      }

      const guildLoggingChannelId =
        guildConfigurations.transferLoggingChannelId ?? null;

      if (isValidString(guildLoggingChannelId)) {
        sendEmbed(
          client,
          COMMAND_KEYS.DROP,
          guildLoggingChannelId,
          logEmbed,
          [],
        );
      }
    } catch (err) {
      try {
        if (message?.id && channelId) {
          await deleteMessage(client, COMMAND_KEYS.DROP, channelId, message.id);
        }
      } catch (deleteErr) {}
      await catchCommandException(interaction, client, COMMAND_KEYS.DROP, err);
    }
  },
};
