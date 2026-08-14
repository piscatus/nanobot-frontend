const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: reservesAPI } = require("../../requests/reserves.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { buildReservesEmbed } = require("../../utils/reservesUtil.js");
const { executeWithStatusCheck } = require("../../utils/statusUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.RESERVES)
    .setDescription(COMMAND_DESCRIPTIONS.RESERVES)
    .setDMPermission(false),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => reservesAPI(guildId, userId),
        COMMAND_KEYS.RESERVES,
      );
      if (!response) return;

      await interaction.editReply({
        embeds: [buildReservesEmbed(response.data)],
      });
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.RESERVES,
        err,
      );
    }
  },
};
