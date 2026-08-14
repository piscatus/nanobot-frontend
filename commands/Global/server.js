const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: serverAPI } = require("../../requests/server.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
} = require("../../utils/constants.js");
const {
  executeReadOnlyEmbedCommand,
  getAdminMessageOptions,
} = require("../../utils/interactionResponseUtil.js");
const { buildServerEmbed } = require("../../utils/serverUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.SERVER)
    .setDescription(COMMAND_DESCRIPTIONS.SERVER)
    .setDMPermission(false)
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.MESSAGE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
    ),
  async execute(interaction, client) {
    return executeReadOnlyEmbedCommand(interaction, client, {
      commandKey: COMMAND_KEYS.SERVER,
      apiCall: (guildId, userId) => serverAPI(guildId, userId),
      buildEmbed: (data) => buildServerEmbed(data),
      ...getAdminMessageOptions(interaction),
    });
  },
};
