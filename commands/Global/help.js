const { SlashCommandBuilder } = require("@discordjs/builders");
const { execute: helpAPI } = require("../../requests/help.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  COMMAND_KEYS,
  EMOJIS,
  STATUS_CODES,
} = require("../../utils/constants.js");
const { catchCommandException } = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  getAdminMessageOptions,
  respondWithEmbed,
} = require("../../utils/interactionResponseUtil.js");
const { checkStatuses } = require("../../utils/statusUtil.js");
const {
  formatAwardsHelp,
  formatDepositsHelp,
  formatDropsHelp,
  formatFishingHelp,
  formatGiftHelp,
  formatGeneralHelp,
  formatRainHelp,
  formatSalesHelp,
  formatSupportHelp,
  formatUpdatesHelp,
  formatWithdrawalsHelp,
} = require("../../utils/helpUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.HELP)
    .setDescription(COMMAND_DESCRIPTIONS.HELP)
    .addStringOption((option) => {
      const baseOption = option
        .setName(COMMAND_OPTION_KEYS.DOCUMENTATION)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.DOCUMENTATION)
        .setRequired(true)
        .addChoices({ name: "General", value: "10" });

      if (process.env.GUILD_INTENTS_GRANTED === "true") {
        baseOption.addChoices({ name: "Awards", value: "9" });
      }

      baseOption.addChoices({ name: "Deposits", value: "8" });
      baseOption.addChoices({ name: "Drops", value: "7" });
      baseOption.addChoices({ name: "Fishing", value: "6" });
      baseOption.addChoices({ name: "Gifts", value: "5" });
      baseOption.addChoices({ name: "Rains", value: "4" });
      baseOption.addChoices({ name: "Sales", value: "3" });
      baseOption.addChoices({ name: "Support", value: "2" });
      baseOption.addChoices({ name: "Updates", value: "1" });
      baseOption.addChoices({ name: "Withdrawals", value: "0" });

      return baseOption;
    })
    .addBooleanOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.MESSAGE)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.MESSAGE),
    ),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await helpAPI(guildId, userId);

      if (
        !(await checkStatuses(
          interaction,
          response,
          STATUS_CODES.OK,
          COMMAND_KEYS.HELP,
        ))
      )
        return;

      const currencies = response.data.currencies.reduce((acc, currency) => {
        acc[currency.ticker] = currency;
        return acc;
      }, {});

      const embedOptions = {
        10: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.BLUE_HEART + " General",
          content: formatGeneralHelp(response.data.commands),
        },
        9: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.AWARD_TROPHY + " Awards",
          content: formatAwardsHelp(response.data.commands, currencies),
        },
        8: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.DEPOSIT_INBOX + " Deposits",
          content: formatDepositsHelp(response.data.commands, currencies),
        },
        7: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.PARACHUTE_DROP + " Drops",
          content: formatDropsHelp(response.data.commands, currencies),
        },
        6: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.FISHING_ROD + " Fishing",
          content: formatFishingHelp(response.data.commands),
        },
        5: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.GIFT_PRESENT + " Gifts",
          content: formatGiftHelp(response.data.commands, currencies),
        },
        4: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.RAIN_CLOUD + " Rains",
          content: formatRainHelp(response.data.commands, currencies),
        },
        3: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.SHOPPING_CART + " Sales",
          content: formatSalesHelp(response.data.commands),
        },
        2: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.SUPPORT_ANIMAL + " Support",
          content: formatSupportHelp(),
        },
        1: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.UPDATE_REPRESENTATIVE + " Updates",
          content: formatUpdatesHelp(response.data.commands),
        },
        0: {
          color: COLORS.NANOBOT_BLUE,
          title: EMOJIS.WITHDRAW_OUTGOING + " Withdrawals",
          content: formatWithdrawalsHelp(response.data.commands, currencies),
        },
      };

      const selectedEmbed =
        embedOptions[interaction.options.getString("documentation")];

      const HELP_EMBED = buildEmbed({
        color: selectedEmbed.color,
        title: selectedEmbed.title,
        description: selectedEmbed.content,
        thumbnail:
          "https://cdn.discordapp.com/avatars/" +
          process.env.BOT_USER_ID +
          "/" +
          process.env.BOT_USER_AVATAR_HASH +
          "?size=1024",
      });

      return await respondWithEmbed(interaction, client, {
        embed: HELP_EMBED,
        commandKey: COMMAND_KEYS.HELP,
        ...getAdminMessageOptions(interaction),
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.HELP, err);
    }
  },
};
