const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
} = require("../../utils/constants.js");
const {
  buildAliasesEmbed,
  buildAliasesPanels,
  formatDMErrorMessage,
} = require("../../utils/aliasesUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { formatErrorTitle } = require("../../utils/errorUtil.js");
const {
  executeReadOnlyEmbedCommand,
  getAdminMessageOptions,
} = require("../../utils/interactionResponseUtil.js");
const { execute: aliasesAPI } = require("../../requests/aliases.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.ALIASES)
    .setDescription(COMMAND_DESCRIPTIONS.ALIASES)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.GLOBAL)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.ALIASES_GLOBAL)
        .addBooleanOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.MESSAGE)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(COMMAND_OPTION_KEYS.SERVER)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.ALIASES_SERVER)
        .addBooleanOption((option) =>
          option
            .setName(COMMAND_OPTION_KEYS.MESSAGE)
            .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
        ),
    ),
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    return executeReadOnlyEmbedCommand(interaction, client, {
      commandKey: COMMAND_KEYS.ALIASES,
      apiCall: (guildId, userId) =>
        aliasesAPI(guildId, userId, subcommand === COMMAND_OPTION_KEYS.GLOBAL),
      buildPanels: (data) =>
        buildAliasesPanels(subcommand, interaction.guildId ?? null, data),
      // Used for the public "post as message" path, which stays a static embed.
      buildEmbed: (data) =>
        buildAliasesEmbed(subcommand, interaction.guildId ?? null, data),
      ...getAdminMessageOptions(interaction),
      beforeApiCall: async ({ guildId }) => {
        if (guildId === null && subcommand === COMMAND_OPTION_KEYS.SERVER) {
          await interaction.editReply({
            embeds: [
              buildEmbed({
                title: formatErrorTitle(COMMAND_KEYS.ALIASES),
                description: formatDMErrorMessage(),
                error: true,
              }),
            ],
          });
          return true;
        }
      },
    });
  },
};
