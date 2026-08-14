const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: sendAPI } = require("../../requests/send.js");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COMMAND_KEYS,
  COMMAND_DESCRIPTIONS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  NUMBERS,
  EMOJIS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  buildReceiptAndLogEmbeds,
  executeTransferWithConfirmation,
  getConfirmationInfo,
  postTransferReceiptAndLog,
} = require("../../utils/transferUtil.js");
const { getExplorerAccountUrl } = require("../../utils/currencyUtil.js");
const {
  getAndValidateInput,
  validateAddress,
} = require("../../utils/validationUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.SEND)
    .setDescription(COMMAND_DESCRIPTIONS.SEND)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.INPUT)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.SEND_INPUT)
        .setRequired(true)
        .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
    )
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.ADDRESS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.ADDRESS)
        .setRequired(true)
        .setMaxLength(NUMBERS.ADDRESS_LENGTH_MAXIMUM),
    ),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.WITHDRAW_OUTGOING,
        interaction.user.username,
        COMMAND_KEYS.SEND,
      );

      const { guildId, userId } = getInteractionContext(interaction);

      const address = interaction.options.getString("address").trim();

      if (!(await validateAddress(interaction, address, COMMAND_KEYS.SEND)))
        return;

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.SEND,
      );
      if (input === null) return;

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) =>
          sendAPI(guildId, userId, confirmed, input, address),
        statusCommandKey: COMMAND_KEYS.SEND,
        confirmCommandKey: COMMAND_KEYS.WITHDRAW,
        getConfirmationParams: (res) => {
          const ticker = res.data.primaryTransfer.wallets[0].ticker;
          const curr = res.data.currencies.find((c) => c.ticker === ticker);
          return getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.WITHDRAW,
            address,
            isComplete: false,
            optional: null,
            items: [],
            wallets: res.data.primaryTransfer.wallets,
            creatures: res.data.creatures,
            commands: res.data.commands,
            bonuses: res.data.bonuses,
            currencies: res.data.currencies,
            drop: null,
            displayTimestamp: false,
            title: EMBED_TITLE,
            url: getExplorerAccountUrl(curr, address),
            includeNotes: false,
            transactionId: null,
          });
        },
      });

      if (!response) return;

      const ticker = response.data.primaryTransfer.wallets[0].ticker;
      const currency = response.data.currencies.find((c) => c.ticker === ticker);
      const explorerUrl = getExplorerAccountUrl(currency, address);

      const { completedPrimaryTransfers, transactionId } = response.data;
      const completedWallets =
        Object.values(completedPrimaryTransfers)[0].wallets;

      const { receiptEmbed, logEmbed } = buildReceiptAndLogEmbeds({
        userId,
        input,
        command: COMMAND_KEYS.WITHDRAW,
        address,
        isComplete: true,
        optional: null,
        items: [],
        wallets: completedWallets,
        creatures: response.data.creatures,
        commands: response.data.commands,
        bonuses: response.data.bonuses,
        currencies: response.data.currencies,
        drop: null,
        displayTimestamp: false,
        title: EMBED_TITLE,
        url: explorerUrl,
        transactionId,
      });

      await postTransferReceiptAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.SEND,
        receiptEmbed,
        logEmbed,
        loggingChannelId: process.env.WITHDRAW_LOGGING_CHANNEL_ID ?? null,
        ephemeral: true,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.SEND, err);
    }
  },
};
