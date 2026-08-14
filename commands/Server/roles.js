const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: rolesAPI } = require("../../requests/roles.js");
const {
  EMOJIS,
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  PRIVILEGED_ROLE_IDS,
  ROLES,
  STATUS_CODES,
} = require("../../utils/constants.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { checkStatuses } = require("../../utils/statusUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  catchCommandException,
  formatAdminModPermissionMessage,
} = require("../../utils/errorUtil.js");
const { respondWithEmbed } = require("../../utils/interactionResponseUtil.js");
const { formatLevelRolesMessage, formatVipRoleMessage } = require("../../utils/rolesUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.ROLES)
    .setDescription(COMMAND_DESCRIPTIONS.ROLES)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.ROLE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.ROLE)
        .setRequired(true)
        .addChoices(
          { name: ROLES.LEVEL, value: "0" },
          { name: ROLES.VIP, value: "1" },
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.MESSAGE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
    ),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await rolesAPI(guildId, userId);

      if (
        !(await checkStatuses(
          interaction,
          response,
          STATUS_CODES.OK,
          COMMAND_KEYS.ROLES,
        ))
      )
        return;

      const emojiImageUrl = "https://cdn.discordapp.com/emojis/";

      const embedOptions = {
        0: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.LEVEL_ROLES + " Server Level Roles",
          getMessage: formatLevelRolesMessage(),
          image: emojiImageUrl + process.env.HOME_SERVER_NANO_ROLE_EMOJI_ID,
        },
        1: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.VIP_DIAMOND + " Server VIP Role (12 hours)",
          getMessage: formatVipRoleMessage(),
          image: emojiImageUrl + process.env.HOME_SERVER_VIP_ROLE_EMOJI_ID,
        },
      };

      const ruleOption = interaction.options.getString(
        COMMAND_OPTION_KEYS.ROLE,
      );

      const selectedEmbed = embedOptions[ruleOption];
      const embed = buildEmbed({
        color: selectedEmbed.color,
        title: selectedEmbed.title,
        description: selectedEmbed.getMessage,
        thumbnail: selectedEmbed.image,
      });

      return await respondWithEmbed(interaction, client, {
        embed,
        commandKey: COMMAND_KEYS.ROLES,
        isMessage: interaction.options.getBoolean(COMMAND_OPTION_KEYS.MESSAGE),
        isPrivileged: interaction.member?.roles?.cache?.some((role) =>
          PRIVILEGED_ROLE_IDS.includes(role.id),
        ) ?? false,
        formatPermissionMessage: formatAdminModPermissionMessage,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.ROLES, err);
    }
  },
};
