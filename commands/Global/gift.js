const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  NUMBERS,
} = require("../../utils/constants.js");
const {
  catchCommandException,
  formatErrorTitle,
} = require("../../utils/errorUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const { getAndValidateInput } = require("../../utils/validationUtil.js");
const {
  executeTransferWithConfirmation,
  getConfirmationInfo,
  postTransferMessageAndLog,
} = require("../../utils/transferUtil.js");
const { execute: giftAPI } = require("../../requests/gift.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.GIFT)
    .setDescription(COMMAND_DESCRIPTIONS.GIFT)
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.USER)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.USER)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.INPUT)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.GIFT_INPUT)
        .setRequired(true)
        .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
    ),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.GIFT_PRESENT,
        interaction.user.username,
        COMMAND_KEYS.GIFT,
      );

      const gifted =
        interaction.options.getUser(COMMAND_OPTION_KEYS.USER)?.id || "0";

      if (isValidString(gifted) && gifted === interaction.user.id) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.GIFT),
              description:
                "Invalid User: You cannot gift something to yourself! How selfish.",
              error: true,
            }),
          ],
        });
      }

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.GIFT,
      );
      if (input === null) return;

      const { channelId, guildId, userId } =
        getInteractionContext(interaction);

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) =>
          giftAPI(guildId, channelId, userId, [gifted], confirmed, input),
        statusCommandKey: COMMAND_KEYS.GIFT,
        confirmCommandKey: COMMAND_KEYS.GIFT,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.GIFT,
            address: null,
            isComplete: false,
            optional: {
              emoji: EMOJIS.SUBORDINATE,
              title: "Recipient",
              description: `<@${gifted}>`,
            },
            items: res.data.primaryTransfer.items,
            wallets: res.data.primaryTransfer.wallets,
            creatures: res.data.creatures,
            commands: res.data.commands,
            bonuses: res.data.bonuses,
            currencies: res.data.currencies,
            drop: null,
            displayTimestamp: false,
            title: EMBED_TITLE,
            url: null,
            includeNotes: false,
            transactionId: null,
          }),
      });

      if (!response) return;

      await postTransferMessageAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.GIFT,
        emoji: EMOJIS.GIFT_PRESENT,
        response,
        input,
        getRecipientInfo: () => ({
          emoji: EMOJIS.SUBORDINATE,
          title: "Recipient",
          description: `<@${gifted}>`,
        }),
        drop: null,
        embedTitle: EMBED_TITLE,
        getTransferUserSuffix: (transferInfo) => `to ${transferInfo.transferUser}`,
        eachFlag: false,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.GIFT, err);
    }
  },
};
