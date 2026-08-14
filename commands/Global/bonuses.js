const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: bonusesAPI } = require("../../requests/bonuses.js");
const {
  formatBonuses,
  formatBonusesMessage,
} = require("../../utils/bonusesUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
} = require("../../utils/constants.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  executeReadOnlyEmbedCommand,
  getAdminMessageOptions,
} = require("../../utils/interactionResponseUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.BONUSES)
    .setDescription(COMMAND_DESCRIPTIONS.BONUSES)
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.MESSAGE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
    ),
  async execute(interaction, client) {
    return executeReadOnlyEmbedCommand(interaction, client, {
      commandKey: COMMAND_KEYS.BONUSES,
      apiCall: (guildId, userId) => bonusesAPI(guildId, userId),
      buildEmbed: (data) =>
        buildEmbed({
          color: COLORS.NANOBOT_BLUE,
          title: `${EMOJIS.SALE_BONUS} ${COMMAND_DESCRIPTIONS.BONUSES}`,
          description: formatBonusesMessage(data.commands),
          fields: formatBonuses(data.bonuses),
        }),
      ...getAdminMessageOptions(interaction),
    });
  },
};
