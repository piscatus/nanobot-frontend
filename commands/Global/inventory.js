const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: inventoryAPI } = require("../../requests/inventory.js");
const { carousel } = require("../../utils/buttonUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  buildInventoryPanels,
} = require("../../utils/inventoryUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.INVENTORY)
    .setDescription(COMMAND_DESCRIPTIONS.INVENTORY),

  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => inventoryAPI(guildId, userId),
        COMMAND_KEYS.INVENTORY,
      );
      if (!response) return;

      const panels = buildInventoryPanels(
        response.data,
        interaction.user.username,
      );

      return await carousel(interaction, client, panels);
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.INVENTORY,
        err,
      );
    }
  },
};
