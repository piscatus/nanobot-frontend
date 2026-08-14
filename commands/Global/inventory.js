const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: inventoryAPI } = require("../../requests/inventory.js");
const { swap } = require("../../utils/buttonUtil.js");
const { formatMergeMessage } = require("../../utils/commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("../../utils/constants.js");
const {
  formatCreatureSaleMessage,
  formatCreatureTransferMessage,
} = require("../../utils/creatureUtil.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  buildInventoryEmbed,
  formatInventory,
  formatInventoryContent,
  getSortedInventory,
} = require("../../utils/inventoryUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
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

      const { bonuses, currencies, creatures, userDetails } = response.data;

      const subordinateUserId = userDetails
        ? userDetails.subordinateUserId
        : null;

      const userItemArray = getSortedInventory(
        response.data.userItems,
        creatures,
        currencies,
        bonuses,
      );

      const subordinateItemArray = subordinateUserId
        ? getSortedInventory(
            response.data.subordinateItems,
            creatures,
            currencies,
            bonuses,
          )
        : [];

      const userInfo = formatInventory(userItemArray, true);

      const sellNote =
        userItemArray?.length > 0
          ? formatCreatureSaleMessage(response.data.commands)
          : "";

      const transferNote =
        userItemArray?.length > 0
          ? formatCreatureTransferMessage(response.data.commands)
          : "";

      const actionMessages =
        `${transferNote}` +
        "\n" +
        `${formatInventoryContent(response.data.commands)}` +
        "\n" +
        `${sellNote}`;

      const EMBED_TITLE =
        EMOJIS.INVENTORY_CABINET +
        " " +
        interaction.user.username +
        "'s " +
        COMMAND_DESCRIPTIONS.INVENTORY;

      const EMBED_COLOR = COLORS.NANOBOT_BLUE;

      if (isValidString(subordinateUserId)) {
        await swap(
          interaction,
          client,
          EMBED_COLOR,
          EMBED_COLOR,
          EMBED_TITLE,
          null,
          actionMessages,
          userInfo,
          EMOJIS.SUBORDINATE +
            " " +
            "Subordinate's " +
            COMMAND_DESCRIPTIONS.INVENTORY,
          null,
          formatMergeMessage(
            response.data.commands,
            subordinateUserId,
            COMMAND_KEYS.CREATURES,
            COMMAND_KEYS.INVENTORY,
          ),
          formatInventory(subordinateItemArray, false),
        );
      } else {
        await interaction.editReply({
          embeds: [buildInventoryEmbed(response.data, interaction.user.username)],
        });
      }
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
