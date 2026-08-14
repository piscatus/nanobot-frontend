const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatAudit } = require("../../utils/auditUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");
const { execute: auditAPI } = require("../../requests/audit.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.AUDIT)
    .setDescription(COMMAND_DESCRIPTIONS.AUDIT),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => auditAPI(guildId, userId),
        COMMAND_KEYS.AUDIT,
      );
      if (!response) return;

      return await interaction.editReply({
        embeds: [formatAudit(response.data)],
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.AUDIT, err);
    }
  },
};
