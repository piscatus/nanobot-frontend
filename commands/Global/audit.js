const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatAudit } = require("../../utils/auditUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
} = require("../../utils/constants.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  catchCommandException,
  formatErrorTitle,
} = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");
const { execute: auditAPI } = require("../../requests/audit.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.AUDIT)
    .setDescription(COMMAND_DESCRIPTIONS.AUDIT)
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.REVEAL)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.REVEAL),
    ),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);

      const requestedReveal =
        interaction.options.getBoolean(COMMAND_OPTION_KEYS.REVEAL) === true;
      const isOwner = userId === process.env.BOT_OWNER_USER_ID;

      // Refuse rather than silently downgrading to a concealed report, so it is
      // never ambiguous whether the figures shown are the real ones.
      if (requestedReveal && !isOwner) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.AUDIT),
              description:
                "Only the bot owner can reveal private currency balances.",
              error: true,
            }),
          ],
        });
      }

      const response = await executeWithStatusCheck(
        interaction,
        () => auditAPI(guildId, userId),
        COMMAND_KEYS.AUDIT,
      );
      if (!response) return;

      return await interaction.editReply({
        embeds: [formatAudit(response.data, requestedReveal && isOwner)],
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.AUDIT, err);
    }
  },
};
