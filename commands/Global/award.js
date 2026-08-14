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
const { resolveRoleAndMemberIds } = require("../../utils/roleUtil.js");
const { formatUserMentions } = require("../../utils/stringUtil.js");
const { getAndValidateInput } = require("../../utils/validationUtil.js");
const {
  executeTransferWithConfirmation,
  getConfirmationInfo,
  postTransferMessageAndLog,
} = require("../../utils/transferUtil.js");
const { execute: giftAPI } = require("../../requests/gift.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.AWARD)
    .setDescription(COMMAND_DESCRIPTIONS.AWARD)
    .setDMPermission(false)
    .addRoleOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.ROLE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.ROLE)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.INPUT)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.AWARD_INPUT)
        .setRequired(true)
        .setMaxLength(NUMBERS.MAXIMUM_INPUT_LENGTH),
    ),
  async execute(interaction, client) {
    try {
      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.AWARD_TROPHY,
        interaction.user.username,
        COMMAND_KEYS.AWARD,
      );

      const input = await getAndValidateInput(
        interaction,
        COMMAND_KEYS.AWARD,
      );
      if (input === null) return;

      const { channelId, guildId, userId } =
        getInteractionContext(interaction);
      const roleId =
        interaction.options.getRole(COMMAND_OPTION_KEYS.ROLE)?.id ?? "0";

      if (roleId === "0" || roleId === interaction.guildId) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.AWARD),
              description: "Invalid Role: You must enter a server role.",
              error: true,
            }),
          ],
        });
      }

      const result = await resolveRoleAndMemberIds(
        interaction,
        roleId,
        COMMAND_KEYS.AWARD,
        { excludeIssuer: true, normalizeGuildId: false },
      );
      if (!result) return;

      let userIdsWithRole = result.userIdsWithRole;

      if (userIdsWithRole.length === 0) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.AWARD),
              description:
                "Invalid Role: You must enter a server role with at least one user, excluding the command issuer.",
              error: true,
            }),
          ],
        });
      }

      if (userIdsWithRole.length > NUMBERS.MAXIMUM_USERS_ACTIVE) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.AWARD),
              description: `Invalid Role: You must enter a server role with **${NUMBERS.MAXIMUM_USERS_ACTIVE} or less** users.`,
              error: true,
            }),
          ],
        });
      }

      const roleUsersString = formatUserMentions(userIdsWithRole);

      const response = await executeTransferWithConfirmation(interaction, {
        apiCall: (confirmed) =>
          giftAPI(guildId, channelId, userId, userIdsWithRole, confirmed, input),
        statusCommandKey: COMMAND_KEYS.AWARD,
        confirmCommandKey: COMMAND_KEYS.AWARD,
        getConfirmationParams: (res) =>
          getConfirmationInfo({
            userId,
            input,
            command: COMMAND_KEYS.AWARD,
            address: null,
            isComplete: false,
            optional: {
              emoji: EMOJIS.SUBORDINATE,
              title: "Recipient(s)",
              description: roleUsersString,
            },
            items: res.data.primaryTransfer.items,
            wallets: res.data.primaryTransfer.wallets,
            creatures: res.data.creatures,
            commands: res.data.commands,
            bonuses: res.data.bonuses,
            currencies: res.data.currencies,
            drop: { requiredRole: roleId },
            displayTimestamp: false,
            title: EMBED_TITLE,
            url: null,
            includeNotes: false,
            transactionId: null,
          }),
      });

      if (!response) return;

      await postTransferMessageAndLog(interaction, client, {
        commandKey: COMMAND_KEYS.AWARD,
        emoji: EMOJIS.AWARD_TROPHY,
        response,
        input,
        getRecipientInfo: () => ({
          emoji: EMOJIS.SUBORDINATE,
          title: "Recipient(s)",
          description: roleUsersString,
        }),
        drop: { requiredRole: roleId },
        embedTitle: EMBED_TITLE,
        getTransferUserSuffix: (transferInfo) =>
          `to <@&${roleId}>: ${transferInfo.transferUser}`,
        eachFlag: true,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.AWARD, err);
    }
  },
};
