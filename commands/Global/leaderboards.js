const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: leaderboardsAPI } = require("../../requests/leaderboards.js");
const {
  buildLeaderboardData,
  paginateLeaderboard,
} = require("../../utils/leaderboardUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.LEADERBOARDS)
    .setDescription(COMMAND_DESCRIPTIONS.LEADERBOARDS)
    .setDMPermission(false),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
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
