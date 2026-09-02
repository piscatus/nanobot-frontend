const { SlashCommandBuilder } = require("@discordjs/builders");
const { carousel } = require("../../utils/buttonUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { executeWithStatusCheck } = require("../../utils/statusUtil.js");
const {
  buildReceivePanels,
} = require("../../utils/receiveUtil.js");
const { execute: receiveAPI } = require("../../requests/receive.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.RECEIVE)
    .setDescription(COMMAND_DESCRIPTIONS.RECEIVE),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => receiveAPI(guildId, userId),
        COMMAND_KEYS.RECEIVE,
      );
      if (!response) return;

      const panels = buildReceivePanels(response.data, userId);

      return carousel(interaction, client, panels);
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.RECEIVE,
        err,
      );
    }
  },
};
