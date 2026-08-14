const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: updateAPI } = require("../../requests/update.js");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COMMAND_KEYS,
  COMMAND_DESCRIPTIONS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  NUMBERS,
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
const { validateAddress } = require("../../utils/validationUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.UPDATE)
    .setDescription(COMMAND_DESCRIPTIONS.UPDATE)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.ADDRESS)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.REPRESENTATIVE)
        .setRequired(true)
        .setMaxLength(NUMBERS.ADDRESS_LENGTH_MAXIMUM),
    ),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.UPDATE_REPRESENTATIVE,
        interaction.user.username,
        COMMAND_KEYS.UPDATE,
      );

      const { guildId, userId } = getInteractionContext(interaction);

      let address = interaction.options.getString("address").trim();

      if (!(await validateAddress(interaction, address, COMMAND_KEYS.UPDATE)))
        return;

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) => updateAPI(guildId, userId, confirmed, address),
        statusCommandKey: COMMAND_KEYS.UPDATE,
        confirmCommandKey: COMMAND_KEYS.UPDATE,
        getConfirmationParams: (res) => {
          const ticker = res.data.primaryTransfer.wallets[0].ticker;
          const curr = res.data.currencies.find((c) => c.ticker === ticker);
          return getConfirmationInfo({
            userId,
            input: null,
            command: COMMAND_KEYS.UPDATE,
            address,
            isComplete: false,
            optional: null,
            items: [],
            wallets: res.data.primaryTransfer.wallets,
            creatures: null,
            commands: res.data.commands,
            bonuses: null,
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

      const { receiptEmbed, logEmbed } = buildReceiptAndLogEmbeds(
        {
          userId,
          input: null,
          command: COMMAND_KEYS.UPDATE,
          address,
          isComplete: true,
          optional: null,
          items: [],
          wallets: response.data.primaryTransfer.wallets,
          creatures: null,
          commands: response.data.commands,
          bonuses: null,
          currencies: response.data.currencies,
          drop: null,
          displayTimestamp: false,
          title: EMBED_TITLE,
          url: explorerUrl,
          transactionId: response.data.transactionId,
        },
        false,
      );

      await postTransferReceiptAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.UPDATE,
        receiptEmbed,
        logEmbed,
        loggingChannelId: process.env.WITHDRAW_LOGGING_CHANNEL_ID ?? null,
        ephemeral: true,
      });
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.UPDATE,
        err,
      );
    }
  },
};
