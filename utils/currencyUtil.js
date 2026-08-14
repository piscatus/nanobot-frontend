const BigNumber = require("bignumber.js");
const { getCommandIds } = require("./commandUtil.js");
const { COMMAND_KEYS } = require("./constants.js");
BigNumber.config({ DECIMAL_PLACES: 30, EXPONENTIAL_AT: 31 });
const dollarValueDecimals = 8;

function getCurrencyDollarValue(
  decimalNumber,
  currencyDollarValue,
  decimalPlaces,
) {
  let result = new BigNumber(decimalNumber)
    .multipliedBy(currencyDollarValue)
    .toFixed(decimalPlaces)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/(\.\d*?[1-9])?\.0+$/, "$1");

  if (result.indexOf(".") === -1) {
    return result;
  }

  if (result.indexOf(".") !== -1 && result.split(".")[1].length < 2) {
    result = `${result}0`;
  }

  return result;
}

function getCurrencyDecimalValue(wholeNumber, precision) {
  const actualValue = new BigNumber(wholeNumber).dividedBy(
    new BigNumber(10).pow(precision),
  );
  return actualValue
    .toFixed(Number(precision))
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/(\.\d*?[1-9])?\.0+$/, "$1")
    .replace(/(?<=^|\D)0+(\.0+)?(?=\D|$)/g, function (p1) {
      return p1 || "0";
    });
}

function getDollarsTotal(wallets, items) {
  let walletsDollarTotal = new BigNumber("0");
  if (wallets !== null) {
    walletsDollarTotal = wallets.reduce((total, walletInfo) => {
      return total.plus(new BigNumber(walletInfo.dollarValue));
    }, new BigNumber(0));
  }

  let itemsDollarTotal = new BigNumber("0");
  if (items !== null) {
    itemsDollarTotal = items.reduce((total, itemInfo) => {
      return total.plus(new BigNumber(itemInfo.dollarValue));
    }, new BigNumber(0));
  }

  const dollarTotal = new BigNumber(walletsDollarTotal).plus(itemsDollarTotal);

  return getCurrencyDollarValue(dollarTotal, 1, dollarValueDecimals);
}

function formatCurrencies(currencies, commands) {
  const commandMap = getCommandIds(commands);

  const walletLink = `</${COMMAND_KEYS.WALLET}:${
    commandMap[COMMAND_KEYS.WALLET]
  }>`;

  const filteredCurrencies = currencies.filter((currency) => {
    return currency.enabled;
  });

  filteredCurrencies.sort((a, b) =>
    a.ticker === b.ticker
      ? a.name.localeCompare(b.name)
      : a.ticker.localeCompare(b.ticker),
  );

  const currencyRows = filteredCurrencies.map((currency) => {
    const emoji = currency.emoji;
    const ticker = currency.ticker;
    const name = currency.name;
    const value = currency.value;
    const precision = currency.precision;
    const processingDeposits = currency.processDeposits;
    const processingWithdrawals = currency.processWithdrawals;
    const formattedMinimumDrop = getCurrencyDecimalValue(
      currency.minimumDrop,
      currency.precision,
    );
    const formattedMinimumGift = getCurrencyDecimalValue(
      currency.minimumGift,
      currency.precision,
    );
    const formattedMinimumRain = getCurrencyDecimalValue(
      currency.minimumRain,
      currency.precision,
    );
    const formattedMinimumDeposit = getCurrencyDecimalValue(
      currency.minimumDeposit,
      currency.precision,
    );
    const formattedMinimumWithdrawal = getCurrencyDecimalValue(
      currency.minimumWithdraw,
      currency.precision,
    );
    const awardNote = process.env.GUILD_INTENTS_GRANTED === "true" ?
      `-# Minimum Award Amount : **${formattedMinimumRain} ${ticker.toUpperCase()}** (${
        currency.precision - currency.minimumRain.length + 1
      } decimal places)` : "";
    return (
      `## ${emoji} **${name}** (**${ticker}**)` +
      "\n" +
      `### ${ticker}/USD : **$${value}**` +
      "\n" +
      `-# Supported Decimal Precision : **${precision}**` +
      "\n" +
      awardNote +
      "\n" +
      `-# Minimum Drop Amount : **${formattedMinimumDrop} ${ticker.toUpperCase()}** (${
        currency.precision - currency.minimumDrop.length + 1
      } decimal places)` +
      "\n" +
      `-# Minimum Gift Amount : **${formattedMinimumGift} ${ticker.toUpperCase()}** (${
        currency.precision - currency.minimumGift.length + 1
      } decimal places)` +
      "\n" +
      `-# Minimum Rain Amount : **${formattedMinimumRain} ${ticker.toUpperCase()}** (${
        currency.precision - currency.minimumRain.length + 1
      } decimal places)` +
      "\n" +
      `-# Processing Deposits : ${processingDeposits ? "✅" : "❌"}` +
      "\n" +
      `-# Minimum Deposit Amount : **${formattedMinimumDeposit} ${ticker.toUpperCase()}** (${
        currency.precision - currency.minimumDeposit.length + 1
      } decimal places)` +
      "\n" +
      `-# Processing Updates & Withdrawals : ${
        processingWithdrawals ? "✅" : "❌"
      }` +
      "\n" +
      `-# Minimum Withdrawal Amount : **${formattedMinimumWithdrawal} ${ticker.toUpperCase()}** (${
        currency.precision - currency.minimumWithdraw.length + 1
      } decimal places)`
    );
  });

  return (
    formatCurrencyTransferMessage(commands) +
    "\n" +
    formatCurrencyReceiveMessage(commands) +
    "\n" +
    formatCurrencySendMessage(commands) +
    "\n" +
    `-# Use ${walletLink} to view all currency balances!\n` +
    `${currencyRows.join("\n")}`
  );
}

function getExplorerAccountUrl(currency, address) {
  return `https://nanexplorer.com/${currency.name.toLowerCase()}/accounts/${address}`;
}

function formatCurrencyMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.CURRENCIES}:${
    commandMap[COMMAND_KEYS.CURRENCIES]
  }> to view all available currency information!`;
}

function formatCurrencyTransferMessage(commands) {
  const commandMap = getCommandIds(commands);

  let message = `-# Use </${COMMAND_KEYS.DROP}:${commandMap[COMMAND_KEYS.DROP]}>, </${COMMAND_KEYS.GIFT}:${commandMap[COMMAND_KEYS.GIFT]}>, and </${COMMAND_KEYS.RAIN}:${commandMap[COMMAND_KEYS.RAIN]}> to transfer currencies to other users within a server!`;

  if (process.env.GUILD_INTENTS_GRANTED === "true") {
    message = `-# Use </${COMMAND_KEYS.AWARD}:${commandMap[COMMAND_KEYS.AWARD]}>, ${message.slice(3)}`;
  }

  return message;
}

function formatCurrencyReceiveMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.RECEIVE}:${
    commandMap[COMMAND_KEYS.RECEIVE]
  }> for deposit information!`;
}

function formatCurrencySendMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.SEND}:${
    commandMap[COMMAND_KEYS.SEND]
  }> to transfer your currency balance to on-chain addresses!`;
}

module.exports = {
  getCurrencyDollarValue,
  getCurrencyDecimalValue,
  getDollarsTotal,
  getExplorerAccountUrl,
  formatCurrencies,
  formatCurrencyMessage,
  formatCurrencyTransferMessage,
  formatCurrencyReceiveMessage,
  formatCurrencySendMessage,
};
