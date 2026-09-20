const { getCommandIds } = require("./commandUtil.js");
const {
  COMMAND_KEYS,
  EMOJIS,
  TICKER_ANY_LABEL,
} = require("./constants.js");
const { getCurrencyDecimalValue } = require("./currencyUtil.js");
const { isValidString } = require("./stringUtil.js");

function formatFishCatchMessage(userId, creature, currency, commands) {
  const commandMap = getCommandIds(commands);
  return (
    "The " +
    currency.name +
    " pirate " +
    "<:pirate:" +
    process.env.PIRATE_EMOJI_ID +
    ">" +
    " <@" +
    userId +
    "> caught... " +
    "\n\n" +
    `**${/^[aeiou]/i.test(creature.name) ? "AN" : "A"} ` +
    creature.name.toUpperCase() +
    "!** " +
    creature.emoji +
    "\n" +
    "1 " +
    creature.name.toLowerCase() +
    ` was added to your </${COMMAND_KEYS.INVENTORY}:` +
    commandMap[COMMAND_KEYS.INVENTORY] +
    ">.\n" +
    "*1 " +
    creature.name.toLowerCase() +
    ` can </${COMMAND_KEYS.SELL}:` +
    commandMap[COMMAND_KEYS.SELL] +
    "> for* - **" +
    getCurrencyDecimalValue(creature.value, currency.precision) +
    " " +
    currency.ticker.toUpperCase() +
    "**"
  );
}

function formatFishLogMessage(userId, creature, currency, commands) {
  const commandMap = getCommandIds(commands);
  return (
    `The user <@${userId}> caught ` +
    `${/^[aeiou]/i.test(creature.name) ? "an" : "a"} **` +
    creature.name.toUpperCase() +
    "** " +
    creature.emoji +
    "\n" +
    "1 " +
    creature.name.toLowerCase() +
    " catch has deducted - **" +
    getCurrencyDecimalValue(creature.value * 2, currency.precision) +
    " " +
    currency.name +
    " (" +
    creature.ticker.toUpperCase() +
    ")" +
    `** from this server's </${COMMAND_KEYS.RESERVES}:` +
    commandMap[COMMAND_KEYS.RESERVES] +
    ">.\n" +
    `### ${EMOJIS.MONEY_BAGS} __**Current Server Balances**__`
  );
}

/**
 * Confirms the default currency a catch just set, for the receipt's optional
 * section. A null ticker means the user cleared it and is back to fishing for
 * anything.
 */
function formatFishDefaultMessage(ticker, currencies, commands) {
  const commandMap = getCommandIds(commands);
  const fishCommand = isValidString(commandMap[COMMAND_KEYS.FISH])
    ? `</${COMMAND_KEYS.FISH}:${commandMap[COMMAND_KEYS.FISH]}>`
    : `/${COMMAND_KEYS.FISH}`;

  if (!isValidString(ticker)) {
    return (
      `You will now fish for **any** currency's creatures in this server.\n` +
      `-# Pick a currency on ${fishCommand} to only catch that currency again.`
    );
  }

  const currency = (currencies ?? []).find((coin) => coin.ticker === ticker);
  const label = currency
    ? `${currency.emoji} **${currency.name} [${currency.ticker}]**`
    : `**${ticker}**`;

  return (
    `You will now fish for ${label} creatures in this server.\n` +
    `-# Pick \`${TICKER_ANY_LABEL}\` on ${fishCommand} to fish for anything again.`
  );
}

function formatFishCommandMessage(commands) {
  const commandMap = getCommandIds(commands);
  if (isValidString(commandMap[COMMAND_KEYS.FISH])) {
    return `You can </${COMMAND_KEYS.FISH}:${
      commandMap[COMMAND_KEYS.FISH]
    }> again! <:fishing:${process.env.FISHING_EMOJI_ID}>`;
  }
  return "You can /fish again!";
}

function formatFishReminderMessage(userId) {
  return `<@${userId}>, your fishing cooldown has ended!`;
}

module.exports = {
  formatFishCommandMessage,
  formatFishDefaultMessage,
  formatFishReminderMessage,
  formatFishLogMessage,
  formatFishCatchMessage,
};
