const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: rulesAPI } = require("../../requests/rules.js");
const {
  CHANNELS,
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  PRIVILEGED_ROLE_IDS,
  STATUS_CODES,
} = require("../../utils/constants.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  catchCommandException,
  formatAdminModPermissionMessage,
} = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const { respondWithEmbed } = require("../../utils/interactionResponseUtil.js");
const { formatRulesMap } = require("../../utils/rulesUtil.js");
const { checkStatuses } = require("../../utils/statusUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.RULES)
    .setDescription(COMMAND_DESCRIPTIONS.RULES)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.CHANNEL)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.CHANNEL)
        .setRequired(true)
        .addChoices(
          { name: COMMAND_KEYS.SERVER, value: "10" },
          { name: CHANNELS.SUPPORT, value: "9" },
          { name: CHANNELS.GENERAL, value: "8" },
          { name: CHANNELS.OFF_TOPIC, value: "7" },
          { name: CHANNELS.IMAGES, value: "6" },
          { name: CHANNELS.MEDIA, value: "5" },
          { name: CHANNELS.TIP_CHAT, value: "4" },
          { name: CHANNELS.AIRDROPS, value: "3" },
          { name: CHANNELS.FISHING, value: "2" },
          { name: CHANNELS.SWAPS, value: "1" },
          { name: CHANNELS.TRADES, value: "0" },
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
      const response = await rulesAPI(guildId, userId);

      if (
        !(await checkStatuses(
          interaction,
          response,
          STATUS_CODES.OK,
          COMMAND_KEYS.RULES,
        ))
      )
        return;

      const ruleOption = interaction.options.getString(
        COMMAND_OPTION_KEYS.CHANNEL,
      );

      const rule = formatRulesMap(response.data.commands)[ruleOption];

      const embed = buildEmbed({
        color: COLORS.RULES_RED,
        title: rule.title,
        description: rule.desc,
      });

      return await respondWithEmbed(interaction, client, {
        embed,
        commandKey: COMMAND_KEYS.RULES,
        isMessage: interaction.options.getBoolean(COMMAND_OPTION_KEYS.MESSAGE),
        isPrivileged: interaction.member?.roles?.cache?.some((role) =>
          PRIVILEGED_ROLE_IDS.includes(role.id),
        ) ?? false,
        formatPermissionMessage: formatAdminModPermissionMessage,
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.RULES, err);
    }
  },
};
