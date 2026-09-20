const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  NUMBERS,
  TRIVIA_DIFFICULTIES,
} = require("../../utils/constants.js");
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
  executeTransferWithConfirmation,
  getConfirmationInfo,
  getTransferInfo,
} = require("../../utils/transferUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const {
  buildAnswerButtons,
  buildCategoryChoices,
  buildTriviaEmbedFields,
  computeAndValidateTriviaDuration,
  formatQuestion,
  resolveCategory,
} = require("../../utils/triviaUtil.js");
const {
  getAndValidateInput,
  validateNumericOption,
} = require("../../utils/validationUtil.js");
const { execute: triviadropAPI } = require("../../requests/triviadrop.js");
const { execute: dropUpdateAPI } = require("../../requests/dropUpdate.js");

/**
 * A drop with a question attached. The reward is escrowed exactly like /drop,
 * but only users who press the right answer button share it, and `users` caps
 * how many of them can win rather than how many may answer. There is no role
 * or random option on purpose: trivia drops are open to everyone and speed
 * plus knowledge decide, not chance.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.TRIVIADROP)
    .setDescription(COMMAND_DESCRIPTIONS.TRIVIADROP)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.INPUT)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.TRIVIADROP_INPUT)
        .setRequired(true)
        .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
    )
    // Autocomplete rather than choices: the bank already has more categories
    // than the 25 a choice list may hold once custom ones are added.
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.CATEGORY)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.TRIVIA_CATEGORY)
        .setRequired(false)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.DIFFICULTY)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.TRIVIA_DIFFICULTY)
        .setRequired(false)
        .addChoices(...TRIVIA_DIFFICULTIES),
    )
    .addIntegerOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.DURATION_MINUTES)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MINUTES)
        .setRequired(false)
        .setMinValue(NUMBERS.MINIMUM_MINUTES_TRIVIADROP)
        .setMaxValue(NUMBERS.MAXIMUM_MINUTES_TRIVIADROP),
    )
    // Max 59 here; the 10-second floor is JS-only so minutes > 0 may use 0–9.
    .addIntegerOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.DURATION_SECONDS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.SECONDS)
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(NUMBERS.MAXIMUM_SECONDS_TRIVIADROP),
    )
    .addNumberOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.USERS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.TRIVIA_WINNERS)
        .setRequired(false)
        .setMinValue(NUMBERS.MINIMUM_USERS_TRIVIADROP)
        .setMaxValue(NUMBERS.MAXIMUM_USERS_TRIVIADROP),
    ),
  async autocomplete(interaction, client) {
    // Discord discards a suggestion response after three seconds, so this
    // answers from the category list cached at startup, not a live API call.
    const categories = client?.commandContext?.triviaCategories ?? [];
    await interaction.respond(
      buildCategoryChoices(categories, interaction.options.getFocused()),
    );
  },
  async execute(interaction, client) {
    let message = null;
    let channelId = null;
    try {
      const durationMinutes = interaction.options.getInteger(
        COMMAND_OPTION_KEYS.DURATION_MINUTES,
      );
      const durationSeconds = interaction.options.getInteger(
        COMMAND_OPTION_KEYS.DURATION_SECONDS,
      );

      const {
        minutes: minutesActiveConfig,
        seconds,
        error: durationError,
      } = computeAndValidateTriviaDuration(durationMinutes, durationSeconds);

      if (durationError) {
        return await interaction.editReply({
          embeds: [buildEmbed({ ...durationError, error: true })],
        });
      }

      const context = getInteractionContext(interaction);
      channelId = context.channelId;
      const { guildId, userId } = context;

      const usersResult = await validateNumericOption(
        interaction,
        interaction.options.getNumber(COMMAND_OPTION_KEYS.USERS),
        {
          min: NUMBERS.MINIMUM_USERS_TRIVIADROP,
          max: NUMBERS.MAXIMUM_USERS_TRIVIADROP,
          commandKey: COMMAND_KEYS.TRIVIADROP,
          fieldName: "The maximum number of winners",
          maxDescription:
            "Trivia drops cannot specify more than " +
            NUMBERS.MAXIMUM_USERS_TRIVIADROP +
            " winners!",
          minDescription:
            "The maximum number of winners must be at least " +
            NUMBERS.MINIMUM_USERS_TRIVIADROP +
            "!",
          wholeNumberDescription:
            "The maximum number of winners must be a whole number!",
          defaultValue: 0,
        },
      );
      if (usersResult === null) return;
      const users = usersResult;

      const category = resolveCategory(
        client?.commandContext?.triviaCategories,
        interaction.options.getString(COMMAND_OPTION_KEYS.CATEGORY),
      );
      if (category === undefined) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.TRIVIADROP),
              description:
                "That trivia category does not exist. Pick one of the suggestions, or leave the category empty for a question from any category!",
              error: true,
            }),
          ],
        });
      }

      // A fixed choice list, so the value is one of TRIVIA_DIFFICULTIES or null.
      const difficulty =
        interaction.options.getString(COMMAND_OPTION_KEYS.DIFFICULTY) ?? null;

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.TRIVIADROP,
      );
      if (input === null) return;

      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.TRIVIA_BRAIN,
        interaction.user.username,
        COMMAND_KEYS.TRIVIADROP,
      );

      let response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) =>
          triviadropAPI(
            guildId,
            channelId,
            userId,
            minutesActiveConfig,
            users,
            confirmed,
            input,
            interaction.user.username,
            category,
            difficulty,
            seconds,
          ),
        statusCommandKey: COMMAND_KEYS.TRIVIADROP,
        confirmCommandKey: COMMAND_KEYS.TRIVIADROP,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input: null,
            command: COMMAND_KEYS.TRIVIADROP,
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

      const trivia = drop?.trivia;
      if (!trivia || !Array.isArray(trivia.answers) || !trivia.answers.length) {
        // The funds are escrowed and the cron will return them when the drop
        // ends; there is just nothing to ask, so say so rather than post a
        // question-less drop.
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.TRIVIADROP),
              description:
                "The trivia question could not be loaded.\n" +
                "The dropped funds will be returned to you when the drop has ended, sorry for the inconvenience!",
              error: true,
            }),
          ],
          components: [],
        });
      }

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
        COMMAND_KEYS.TRIVIADROP,
        completedPrimaryTransfers,
        aliases,
        response.data.bonuses,
        response.data.commands,
        currencies,
        creatures,
        false,
        interaction.user.username,
      );

      const prefinalMessage =
        `${transferInfo.transferMessage} ` +
        `${EMOJIS.TRIVIA_BRAIN} ` +
        `to transfer ` +
        `**${input}**`;

      const postfinalMessage =
        `${transferInfo.transferEmojis}` +
        `${transferInfo.transferValue} ` +
        `${transferInfo.transferDollarValue}`;

      // The answers are only ever on the buttons, never in this text.
      const finalMessage =
        prefinalMessage +
        "\n" +
        postfinalMessage +
        "\n\n" +
        formatQuestion(trivia) +
        "\n-# Press the button with the correct answer. The first " +
        (isValidString(drop.maximumEntries) && drop.maximumEntries.length < 4
          ? `**${drop.maximumEntries}** correct answers share`
          : "correct answers share") +
        " the drop when it ends!";

      const finalEmbed = buildEmbed({
        color: customColor,
        title: EMOJIS.TRIVIA_BRAIN + " A trivia drop appears!",
        description: finalMessage,
        fields: buildTriviaEmbedFields(drop),
      });

      const answerButtons = buildAnswerButtons(trivia.answers);

      message = await sendEmbed(
        client,
        COMMAND_KEYS.TRIVIADROP,
        channelId,
        finalEmbed,
        [],
      );

      const completedTransfer = Object.values(completedPrimaryTransfers)[0];
      const receiptEmbed = getConfirmationInfo({
        userId,
        input,
        command: COMMAND_KEYS.TRIVIADROP,
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

        if (updateResponse?.data?.errorMessage != null) {
          await deleteMessage(
            client,
            COMMAND_KEYS.TRIVIADROP,
            channelId,
            message.id,
          );

          await interaction.editReply({
            embeds: [
              buildEmbed({
                title: formatErrorTitle(COMMAND_KEYS.TRIVIADROP),
                description:
                  "The bot was unable to update the trivia drop with the message ID.\n" +
                  "The dropped funds will be returned to you when the drop has ended, sorry for the inconvenience!",
                error: true,
              }),
            ],
            components: [],
          });
        } else {
          await editEmbed(
            client,
            COMMAND_KEYS.TRIVIADROP,
            channelId,
            finalEmbed,
            [answerButtons],
            message.id,
          );

          await interaction.editReply({
            embeds: [receiptEmbed],
            components: [],
          });

          logEmbed = getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.TRIVIADROP,
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
        await catchMessageException(interaction, COMMAND_KEYS.TRIVIADROP);
        logEmbed = getConfirmationInfo({
          userId,
          input,
          command: COMMAND_KEYS.TRIVIADROP,
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
            COMMAND_KEYS.TRIVIADROP,
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
          COMMAND_KEYS.TRIVIADROP,
          guildLoggingChannelId,
          logEmbed,
          [],
        );
      }
    } catch (err) {
      try {
        if (message?.id && channelId) {
          await deleteMessage(
            client,
            COMMAND_KEYS.TRIVIADROP,
            channelId,
            message.id,
          );
        }
      } catch (deleteErr) {}
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.TRIVIADROP,
        err,
      );
    }
  },
};
