const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  EMOJIS,
  NUMBERS,
} = require("../../utils/constants.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { getAndValidateInput } = require("../../utils/validationUtil.js");
const {
  buildReceiptAndLogEmbeds,
  executeTransferWithConfirmation,
  getConfirmationInfo,
  postTransferReceiptAndLog,
} = require("../../utils/transferUtil.js");
const { execute: sellAPI } = require("../../requests/sell.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.SELL)
    .setDescription(COMMAND_DESCRIPTIONS.SELL)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.INPUT)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.SELL_INPUT)
        .setRequired(true)
        .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
    ),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.SHOPPING_CART,
        interaction.user.username,
        COMMAND_KEYS.SELL,
      );

      const { guildId, userId } = getInteractionContext(interaction);

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.SELL,
      );
      if (input === null) return;

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) => sellAPI(guildId, userId, confirmed, input),
        statusCommandKey: COMMAND_KEYS.SELL,
        confirmCommandKey: COMMAND_KEYS.SALE,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.SALE,
            address: null,
            isComplete: false,
            optional: "",
            items: res.data.primaryTransfer.items,
            wallets: res.data.secondaryTransfer.wallets,
            creatures: res.data.creatures,
            commands: res.data.commands,
            bonuses: res.data.bonuses,
            currencies: res.data.currencies,
            drop: null,
            displayTimestamp: false,
            title: EMBED_TITLE,
            url: null,
            includeNotes: false,
            transactionId: null,
          }),
      });

      if (!response) return;

      const {
        commands,
        completedPrimaryTransfers,
        completedSecondaryTransfers,
        creatures,
        transactionId,
      } = response.data;

      const completedPrimary = Object.values(completedPrimaryTransfers)[0];
      const completedSecondary = Object.values(completedSecondaryTransfers)[0];

      const { receiptEmbed, logEmbed } = buildReceiptAndLogEmbeds({
        userId,
        input,
        command: COMMAND_KEYS.SELL,
        address: null,
        isComplete: true,
        optional: "",
        items: completedPrimary.items,
        wallets: completedSecondary.wallets,
        creatures,
        commands,
        bonuses: response.data.bonuses,
        currencies: response.data.currencies,
        drop: null,
        displayTimestamp: false,
        title: EMBED_TITLE,
        url: null,
        transactionId,
      });

      await postTransferReceiptAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.SELL,
        receiptEmbed,
        logEmbed,
        loggingChannelId: process.env.SALE_LOGGING_CHANNEL_ID ?? null,
        ephemeral: true,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.SELL, err);
    }
  },
};
