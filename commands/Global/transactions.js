const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: transactionsAPI } = require("../../requests/transactions.js");
const { paginateTransactions } = require("../../utils/transactionUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  TRANSACTION_FILTERS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { executeWithStatusCheck } = require("../../utils/statusUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.TRANSACTIONS)
    .setDescription(COMMAND_DESCRIPTIONS.TRANSACTIONS)
    .setDMPermission(true)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.TYPE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.TRANSACTION_TYPE)
        .setRequired(false)
        .addChoices(
          ...TRANSACTION_FILTERS.map((filter) => ({
            name: filter.label,
            value: filter.value,
          })),
        ),
    ),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const type = interaction.options.getString(COMMAND_OPTION_KEYS.TYPE);
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
        type,
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
