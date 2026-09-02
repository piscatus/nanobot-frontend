const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: leaderboardsAPI } = require("../../requests/leaderboards.js");
const {
  buildCreatureAutocompleteChoices,
  buildLeaderboardData,
  paginateLeaderboard,
} = require("../../utils/leaderboardUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
} = require("../../utils/constants.js");
const { buildCurrencyChoices } = require("../../utils/currencyUtil.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");

function buildLeaderboardsCommand(currencyChoices) {
  const builder = new SlashCommandBuilder()
    .setName(COMMAND_KEYS.LEADERBOARDS)
    .setDescription(COMMAND_DESCRIPTIONS.LEADERBOARDS)
    .setDMPermission(false);

  if (currencyChoices?.length) {
    builder.addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.CURRENCY)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.LEADERBOARD_CURRENCY)
        .setRequired(false)
        .addChoices(...currencyChoices),
    );
  }

  // Autocomplete rather than choices: four currencies of eight creatures is 32,
  // and a choice list is capped at 25. Autocomplete has no such ceiling, since
  // it only ever returns the matches for what has been typed.
  builder.addStringOption((option) =>
    option
      .setName(COMMAND_OPTION_KEYS.CREATURE)
      .setDescription(COMMAND_OPTION_DESCRIPTIONS.LEADERBOARD_CREATURE)
      .setRequired(false)
      .setAutocomplete(true),
  );

  return builder;
}

module.exports = {
  data: buildLeaderboardsCommand(),
  /**
   * Discord fixes a command's choices when it is deployed, so the currency list
   * is resolved from the API once at startup. Without it the command deploys
   * with the creature option alone, which still covers every creature.
   */
  buildData({ currencies, creatures } = {}) {
    return buildLeaderboardsCommand(buildCurrencyChoices(currencies, creatures));
  },
  async autocomplete(interaction, client) {
    // Discord discards a suggestion response after three seconds, so this
    // answers from the creature list cached at startup instead of calling the
    // API on every keystroke.
    const creatures = client?.commandContext?.creatures ?? [];
    const ticker = interaction.options.getString(COMMAND_OPTION_KEYS.CURRENCY);
    await interaction.respond(
      buildCreatureAutocompleteChoices(
        creatures,
        interaction.options.getFocused(),
        ticker,
      ),
    );
  },
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const ticker = interaction.options.getString(
        COMMAND_OPTION_KEYS.CURRENCY,
      );
      const creature = interaction.options.getString(
        COMMAND_OPTION_KEYS.CREATURE,
      );
      const response = await executeWithStatusCheck(
        interaction,
        () => leaderboardsAPI(guildId, userId),
        COMMAND_KEYS.LEADERBOARDS,
      );
      if (!response) return;

      const sortedItemMap = buildLeaderboardData(response.data);

      return await paginateLeaderboard(
        interaction,
        client,
        COMMAND_DESCRIPTIONS.LEADERBOARDS,
        sortedItemMap,
        response.data.commands,
        userId,
        response.data.currencies,
        ticker,
        creature,
      );
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.LEADERBOARDS,
        err,
      );
    }
  },
};
