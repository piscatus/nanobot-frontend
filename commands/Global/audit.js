const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: auditAPI } = require("../../requests/audit.js");
const { buildAuditPanels, formatAudit } = require("../../utils/auditUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
} = require("../../utils/constants.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { formatErrorTitle } = require("../../utils/errorUtil.js");
const {
  executeReadOnlyEmbedCommand,
} = require("../../utils/interactionResponseUtil.js");

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
    const requestedReveal =
      interaction.options.getBoolean(COMMAND_OPTION_KEYS.REVEAL) === true;
    const isOwner = interaction.user.id === process.env.BOT_OWNER_USER_ID;
    const reveal = requestedReveal && isOwner;

    return executeReadOnlyEmbedCommand(interaction, client, {
      commandKey: COMMAND_KEYS.AUDIT,
      apiCall: (guildId, userId) => auditAPI(guildId, userId),
      // Refuse rather than silently downgrading to a concealed report, so it is
      // never ambiguous whether the figures shown are the real ones.
      beforeApiCall: async () => {
        if (!requestedReveal || isOwner) {
          return false;
        }

        await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.AUDIT),
              description:
                "Only the bot owner can reveal private currency balances.",
              error: true,
            }),
          ],
        });

        return true;
      },
      buildPanels: (data) => buildAuditPanels(data, reveal),
      buildEmbed: (data) => formatAudit(data, reveal),
    });
  },
};
