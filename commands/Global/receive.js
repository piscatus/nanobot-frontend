const { SlashCommandBuilder } = require("@discordjs/builders");
const { swap } = require("../../utils/buttonUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { executeWithStatusCheck } = require("../../utils/statusUtil.js");
const {
  buildReceiveSwapParams,
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

      const params = buildReceiveSwapParams(response.data, userId);

      return swap(
        interaction,
        client,
        params.color1,
        params.color2,
        params.title1,
        params.address1,
        params.content1,
        params.field1,
        params.title2,
        params.address2,
        params.content2,
        params.field2,
      );
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
