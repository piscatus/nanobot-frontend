const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: walletAPI } = require("../../requests/wallet.js");
const { swap } = require("../../utils/buttonUtil.js");
const { formatMergeMessage } = require("../../utils/commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("../../utils/constants.js");
const {
  formatCurrencyMessage,
  formatCurrencyReceiveMessage,
  formatCurrencySendMessage,
  formatCurrencyTransferMessage,
} = require("../../utils/currencyUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const { formatWallet, getSortedWallet } = require("../../utils/walletUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.WALLET)
    .setDescription(COMMAND_DESCRIPTIONS.WALLET),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => walletAPI(guildId, userId),
        COMMAND_KEYS.WALLET,
      );
      if (!response) return;

      const { currencies, userDetails } = response.data;

      const subordinateUserId = userDetails
        ? userDetails.subordinateUserId
        : null;

      const userWalletArray = getSortedWallet(
        response.data.userWallets,
        currencies,
      );

      const subordinateWalletArray = subordinateUserId
        ? getSortedWallet(response.data.subordinateWallets, currencies)
        : [];

      const userInfo = formatWallet(userWalletArray);

      const sendNote =
        userWalletArray && userWalletArray.length > 0
          ? formatCurrencySendMessage(response.data.commands)
          : "";

      const transferNote =
        userWalletArray && userWalletArray.length > 0
          ? formatCurrencyTransferMessage(response.data.commands)
          : "";

      const EMBED_CONTENT =
        `${transferNote}` +
        "\n" +
        `${formatCurrencyMessage(response.data.commands)}` +
        "\n" +
        `${formatCurrencyReceiveMessage(response.data.commands)}` +
        "\n" +
        `${sendNote}`;

      const EMBED_TITLE =
        EMOJIS.MONEY_BAGS +
        " " +
        interaction.user.username +
        "'s " +
        COMMAND_DESCRIPTIONS.WALLET;

      const EMBED_COLOR = COLORS.NANOBOT_BLUE;

      if (isValidString(subordinateUserId)) {
        await swap(
          interaction,
          client,
          EMBED_COLOR,
          EMBED_COLOR,
          EMBED_TITLE,
          null,
          EMBED_CONTENT,
          userInfo,
          EMOJIS.SUBORDINATE +
            " " +
            "Subordinate's " +
            COMMAND_DESCRIPTIONS.WALLET,
          null,
          formatMergeMessage(
            response.data.commands,
            subordinateUserId,
            COMMAND_KEYS.CURRENCIES,
            COMMAND_KEYS.WALLET,
          ),
          formatWallet(subordinateWalletArray),
        );
      } else {
        await interaction.editReply({
          embeds: [
            buildEmbed({
              color: EMBED_COLOR,
              title: EMBED_TITLE,
              description: EMBED_CONTENT,
              fields: userInfo,
            }),
          ],
        });
      }
    } catch (err) {
      await catchCommandException(
        interaction,
        client,
        COMMAND_KEYS.WALLET,
        err,
      );
    }
  },
};
