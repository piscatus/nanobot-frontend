const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: currenciesAPI } = require("../../requests/currencies.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
} = require("../../utils/constants.js");
const {
  buildCurrencyPanels,
  formatCurrencies,
} = require("../../utils/currencyUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  executeReadOnlyEmbedCommand,
  getAdminMessageOptions,
} = require("../../utils/interactionResponseUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.CURRENCIES)
    .setDescription(COMMAND_DESCRIPTIONS.CURRENCIES)
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.MESSAGE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
    ),
  async execute(interaction, client) {
    return executeReadOnlyEmbedCommand(interaction, client, {
      commandKey: COMMAND_KEYS.CURRENCIES,
      apiCall: (guildId, userId) => currenciesAPI(guildId, userId),
      buildPanels: (data) =>
        buildCurrencyPanels(data.currencies, data.commands),
      // Used for the public "post as message" path, which stays a static embed.
      buildEmbed: (data) =>
        buildEmbed({
          color: COLORS.NANOBOT_BLUE,
          title: `${EMOJIS.CURRENCY_COIN} ${COMMAND_DESCRIPTIONS.CURRENCIES}`,
          description: formatCurrencies(data.currencies, data.commands),
        }),
      ...getAdminMessageOptions(interaction),
    });
  },
};
