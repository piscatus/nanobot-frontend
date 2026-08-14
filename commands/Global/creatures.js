const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: creaturesAPI } = require("../../requests/creatures.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
} = require("../../utils/constants.js");
const {
  formatCreatureCommands,
  formatCreatures,
} = require("../../utils/creatureUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  executeReadOnlyEmbedCommand,
  getAdminMessageOptions,
} = require("../../utils/interactionResponseUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.CREATURES)
    .setDescription(COMMAND_DESCRIPTIONS.CREATURES)
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.MESSAGE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
    ),
  async execute(interaction, client) {
    return executeReadOnlyEmbedCommand(interaction, client, {
      commandKey: COMMAND_KEYS.CREATURES,
      apiCall: (guildId, userId) => creaturesAPI(guildId, userId),
      buildEmbed: (data) =>
        buildEmbed({
          color: COLORS.NANOBOT_BLUE,
          title: `${EMOJIS.CREATURES_FISH} ${COMMAND_DESCRIPTIONS.CREATURES}`,
          description: formatCreatureCommands(data.commands),
          fields: formatCreatures(data.creatures, data.currencies),
        }),
      ...getAdminMessageOptions(interaction),
    });
  },
};
