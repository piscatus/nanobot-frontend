const { SlashCommandBuilder } = require("@discordjs/builders");
const { sendEmbed } = require("../../utils/channelUtil.js");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  STATUS_CODES,
} = require("../../utils/constants.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const {
  catchCommandException,
  formatErrorTitle,
} = require("../../utils/errorUtil.js");
const { buildCurrencyChoices } = require("../../utils/currencyUtil.js");
const {
  formatFishLogMessage,
  formatFishCatchMessage,
} = require("../../utils/fishUtil.js");
const {
  getInteractionContext,
  safeDeferUpdate,
} = require("../../utils/interactionUtil.js");
const { checkStatuses } = require("../../utils/statusUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const { getConfirmationInfo } = require("../../utils/transferUtil.js");
const { formatWallet, getSortedWallet } = require("../../utils/walletUtil.js");
const verificationsApi = require("../../requests/verifications.js");
const { execute: fishAPI } = require("../../requests/fish.js");
const { sendVerificationCaptchaPuzzle } = require("../../utils/buttonUtil.js");

async function runFishSuccess(interaction, client, response) {
  const { guildId, userId } = getInteractionContext(interaction);
  const {
    currencies,
    guildConfigurations,
    transactionId,
    completedSecondaryTransfers,
  } = response.data;

  const creature = response.data.creatures.find(
    (tempCreature) =>
      tempCreature.name.toUpperCase() ===
      Object.values(completedSecondaryTransfers)[0].items[0].name.toUpperCase(),
  );

  let currency = null;
  currencies.forEach((coin) => {
    const currencyTicker = coin.ticker;
    if (creature.ticker === currencyTicker) {
      currency = coin;
    }
  });

  const REQUEST_TITLE = formatRequestTitleMessage(
    EMOJIS.FISHING_ROD,
    interaction.user.username,
    COMMAND_KEYS.FISH,
  );

  const receiptEmbed = getConfirmationInfo({
    userId,
    input: null,
    command: COMMAND_KEYS.FISH,
    address: null,
    isComplete: true,
    optional: null,
    items: Object.values(completedSecondaryTransfers)[0].items,
    wallets: Object.values(completedSecondaryTransfers)[0].wallets,
    creatures: response.data.creatures,
    commands: response.data.commands,
    bonuses: response.data.bonuses,
    currencies: response.data.currencies,
    drop: null,
    displayTimestamp: false,
    title: REQUEST_TITLE,
    url: null,
    includeNotes: true,
    transactionId,
  });

  await interaction.editReply({
    embeds: [receiptEmbed],
    components: [],
  });

  let catchMessage = "";

  const fishingChannelId = guildConfigurations.fishingChannelId;

  if (isValidString(fishingChannelId)) {
    catchMessage = await sendEmbed(
      client,
      COMMAND_KEYS.FISH,
      fishingChannelId,
      buildEmbed({
        color: currency.color,
        title: `${EMOJIS.FISHING_ROD} ${currency.name} Creature!`,
        description: formatFishCatchMessage(
          userId,
          creature,
          currency,
          response.data.commands,
        ),
        thumbnail: creature.image,
      }),
    );
  }

  const fishingLoggingChannelId =
    guildConfigurations.fishingLoggingChannelId;

  let logEmbed = null;

  if (isValidString(fishingLoggingChannelId)) {
    const formattedAndSortedWallet = formatWallet(
      getSortedWallet(
        response.data.guildWalletQuantities[0].wallets,
        currencies,
      ),
    );

    if (catchMessage !== undefined && isValidString(catchMessage.id)) {
      logEmbed = buildEmbed({
        color: currency.color,
        title: REQUEST_TITLE,
        description: formatFishLogMessage(
          userId,
          creature,
          currency,
          response.data.commands,
        ),
        fields: formattedAndSortedWallet,
        thumbnail: creature.image,
        url: `https:\/\/discord.com\/channels\/${guildId}\/${fishingChannelId}\/${catchMessage.id}`,
        footer: `Nanobot Transaction ID ${transactionId}`,
      });
    } else {
      logEmbed = buildEmbed({
        color: currency.color,
        title: REQUEST_TITLE,
        description: formatFishLogMessage(
          userId,
          creature,
          currency,
          response.data.commands,
        ),
        fields: formattedAndSortedWallet,
        thumbnail: creature.image,
        footer: `Nanobot Transaction ID ${transactionId}`,
      });
    }

    try {
      await sendEmbed(
        client,
        COMMAND_KEYS.FISH,
        fishingLoggingChannelId,
        logEmbed,
        [],
      );
    } catch (err) {}
  }
}

async function handleCaptchaSuccess(interaction, client, ticker = null) {
  const { guildId, userId } = getInteractionContext(interaction);
  if (!userId) return;

  if (!(await safeDeferUpdate(interaction))) return;

  await verificationsApi.completeAfterCaptcha(userId);

  const response = await fishAPI(
    guildId,
    userId,
    interaction.member?.roles?.cache?.map((r) => r.id) ?? null,
    ticker,
  );

  if (
    !(await checkStatuses(
      interaction,
      response,
      STATUS_CODES.OK,
      COMMAND_KEYS.FISH,
    ))
  ) {
    return;
  }

  await runFishSuccess(interaction, client, response);
}

function buildFishCommand(currencyChoices) {
  const builder = new SlashCommandBuilder()
    .setName(COMMAND_KEYS.FISH)
    .setDescription(COMMAND_DESCRIPTIONS.FISH)
    .setDMPermission(false);

  if (currencyChoices?.length) {
    builder.addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.CURRENCY)
        .setDescription(COMMAND_OPTION_DESCRIPTIONS.FISH_CURRENCY)
        .setRequired(false)
        .addChoices(...currencyChoices),
    );
  }

  return builder;
}

module.exports = {
  handleCaptchaSuccess,
  runFishSuccess,
  data: buildFishCommand(),
  /**
   * Discord fixes a command's choices when it is deployed, so the currency list
   * is resolved from the API once at startup. Without it the command deploys
   * with no option at all and fishing still works, just untargeted.
   */
  buildData({ currencies, creatures } = {}) {
    return buildFishCommand(buildCurrencyChoices(currencies, creatures));
  },
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const ticker = interaction.options.getString(
        COMMAND_OPTION_KEYS.CURRENCY,
      );

      const checkResponse = await verificationsApi.check(userId);

      if (checkResponse?.status === 200) {
        const response = await fishAPI(
          guildId,
          userId ?? null,
          interaction.member.roles.cache.map((r) => r.id) ?? null,
          ticker,
        );

        if (
          !(await checkStatuses(
            interaction,
            response,
            STATUS_CODES.OK,
            COMMAND_KEYS.FISH,
          ))
        )
          return;

        await runFishSuccess(interaction, client, response);
        return;
      }

      const emojisList =
        Array.isArray(checkResponse?.data) ? checkResponse.data : null;

      if (!emojisList || emojisList.length < 4) {
        await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.FISH),
              description:
                "Verification puzzle could not be loaded. Please try again later.",
              error: true,
            }),
          ],
        });
        return;
      }

      await sendVerificationCaptchaPuzzle(
        interaction,
        client,
        userId,
        emojisList,
        {
          commandKey: COMMAND_KEYS.FISH,
          onCaptchaSuccess: (captchaInteraction, captchaClient) =>
            handleCaptchaSuccess(captchaInteraction, captchaClient, ticker),
        },
      );
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.FISH, err);
    }
  },
};
