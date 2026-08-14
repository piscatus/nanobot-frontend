const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COMMAND_KEYS,
  COMMAND_DESCRIPTIONS,
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
const { execute: mergeAPI } = require("../../requests/merge.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.MERGE)
    .setDescription(COMMAND_DESCRIPTIONS.MERGE),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.FIST_BUMP,
        interaction.user.username,
        COMMAND_KEYS.MERGE,
      );

      const { guildId, userId } = getInteractionContext(interaction);

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) => mergeAPI(guildId, userId, confirmed),
        statusCommandKey: COMMAND_KEYS.MERGE,
        confirmCommandKey: COMMAND_KEYS.MERGE,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input: null,
            command: COMMAND_KEYS.MERGE,
            address: null,
            isComplete: false,
            optional: {
              emoji: EMOJIS.SUBORDINATE,
              title: "Subordinate",
              description: `<@${res.data.userDetails.subordinateUserId}>`,
            },
            items: res.data.primaryTransfer.items,
            wallets: res.data.primaryTransfer.wallets,
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
        bonuses,
        completedPrimaryTransfers,
        currencies,
        creatures,
        transactionId,
      } = response.data;

      const subordinateUserId = response.data.userDetails.subordinateUserId;
      const completedTransfer = Object.values(completedPrimaryTransfers)[0];
      const subordinateInfo = {
        emoji: EMOJIS.SUBORDINATE,
        title: "Subordinate",
        description: `<@${subordinateUserId}>`,
      };

      const { receiptEmbed, logEmbed } = buildReceiptAndLogEmbeds({
        userId,
        input: null,
        command: COMMAND_KEYS.MERGE,
        address: null,
        isComplete: true,
        optional: subordinateInfo,
        items: completedTransfer.items,
        wallets: completedTransfer.wallets,
        creatures,
        commands: response.data.commands,
        bonuses,
        currencies,
        drop: null,
        displayTimestamp: false,
        title: EMBED_TITLE,
        url: null,
        transactionId,
      });

      await postTransferReceiptAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.MERGE,
        receiptEmbed,
        logEmbed,
        loggingChannelId: process.env.TRANSFER_LOGGING_CHANNEL_ID ?? null,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.MERGE, err);
    }
  },
};
