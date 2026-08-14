const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: transactionsAPI } = require("../../requests/transactions.js");
const { paginateTransactions } = require("../../utils/transactionUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { executeWithStatusCheck } = require("../../utils/statusUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.TRANSACTIONS)
    .setDescription(COMMAND_DESCRIPTIONS.TRANSACTIONS)
    .setDMPermission(true),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => transactionsAPI(guildId, userId),
        COMMAND_KEYS.TRANSACTIONS,
      );
      if (!response) return;

      return await paginateTransactions(
        interaction,
        client,
        EMOJIS.TRANSACTION_LIST + " " + COMMAND_DESCRIPTIONS.TRANSACTIONS,
        response.data.transactions,
        response.data.commands,
        userId,
        response.data.currencies,
        response.data.creatures,
        response.data.bonuses,
      );
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.TRANSACTIONS,
        err,
      );
    }
  },
};
