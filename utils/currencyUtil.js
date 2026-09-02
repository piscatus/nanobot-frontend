const BigNumber = require("bignumber.js");
const { getCommandIds } = require("./commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("./constants.js");
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

/**
 * Decimal places needed to express a raw amount at a given precision.
 *
 * <p>Counts trailing zeros rather than total length. The older
 * `precision - length + 1` form silently assumed the amount was a single
 * significant digit followed by zeros, which is true of hand-set minimums but
 * not of a computed value such as a fee-inclusive withdrawal floor: 60000001 at
 * precision 12 needs all 12 places, and the old form reported 5.
 */
function getDecimalPlaces(raw, precision) {
  const digits = String(raw ?? "");
  const trimmed = digits.replace(/0+$/, "");
  const trailingZeros = digits.length - trimmed.length;
  return Math.max(0, Number(precision) - trailingZeros);
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

/** Command links shown above the currency details. */
function formatCurrencyCommandLinks(commands) {
  const commandMap = getCommandIds(commands);
  const walletLink = `</${COMMAND_KEYS.WALLET}:${
    commandMap[COMMAND_KEYS.WALLET]
  }>`;

  return (
    formatCurrencyTransferMessage(commands) +
    "\n" +
    formatCurrencyReceiveMessage(commands) +
    "\n" +
    formatCurrencySendMessage(commands) +
    "\n" +
    `-# Use ${walletLink} to view all currency balances!\n`
  );
}

/** Discord rejects a slash command option carrying more than 25 choices. */
const MAXIMUM_CHOICES = 25;

/**
 * Slash command choices for a currency option, labelled "Name [TICKER]".
 *
 * <p>Choices are fixed when the command is deployed, so this runs at startup
 * against the live currency and creature lists. A currency with no creatures is
 * left out: offering it would only ever produce an empty result.
 */
function buildCurrencyChoices(currencies, creatures) {
  const stockedTickers = new Set(
    (creatures ?? []).map((creature) => creature.ticker),
  );

  return getSortedEnabledCurrencies(currencies)
    .filter((currency) => stockedTickers.has(currency.ticker))
    .slice(0, MAXIMUM_CHOICES)
    .map((currency) => ({
      name: `${currency.name} [${currency.ticker}]`,
      value: currency.ticker,
    }));
}

/** Enabled currencies, sorted for stable display order. */
function getSortedEnabledCurrencies(currencies) {
  return (currencies ?? [])
    .filter((currency) => currency.enabled)
    .sort((a, b) =>
      a.ticker === b.ticker
        ? a.name.localeCompare(b.name)
        : a.ticker.localeCompare(b.ticker),
    );
}

function formatCurrencies(currencies, commands) {
  const filteredCurrencies = getSortedEnabledCurrencies(currencies);

  const currencyRows = filteredCurrencies.map(formatCurrencyRow);

  return formatCurrencyCommandLinks(commands) + `${currencyRows.join("\n")}`;
}

/**
 * One currency's detail block. Split out of formatCurrencies so a single
 * currency can be rendered on its own filter panel.
 */
function formatCurrencyRow(currency) {
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
  // The real floor is the configured minimum plus the current fee estimate, not
  // the bare minimum, which a user could not actually withdraw.
  const effectiveMinimumWithdraw = getEffectiveMinimumWithdraw(currency);
  const formattedMinimumWithdrawal = getCurrencyDecimalValue(
    effectiveMinimumWithdraw,
    currency.precision,
  );
  const awardNote =
    process.env.GUILD_INTENTS_GRANTED === "true"
      ? `-# Minimum Award Amount : **${formattedMinimumRain} ${ticker.toUpperCase()}** (${
          getDecimalPlaces(currency.minimumRain, currency.precision)
        } decimal places)`
      : "";
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
      getDecimalPlaces(currency.minimumDrop, currency.precision)
    } decimal places)` +
    "\n" +
    `-# Minimum Gift Amount : **${formattedMinimumGift} ${ticker.toUpperCase()}** (${
      getDecimalPlaces(currency.minimumGift, currency.precision)
    } decimal places)` +
    "\n" +
    `-# Minimum Rain Amount : **${formattedMinimumRain} ${ticker.toUpperCase()}** (${
      getDecimalPlaces(currency.minimumRain, currency.precision)
    } decimal places)` +
    "\n" +
    `-# Processing Deposits : ${processingDeposits ? "✅" : "❌"}` +
    "\n" +
    `-# Minimum Deposit Amount : **${formattedMinimumDeposit} ${ticker.toUpperCase()}** (${
      getDecimalPlaces(currency.minimumDeposit, currency.precision)
    } decimal places)` +
    "\n" +
    `-# Processing Updates & Withdrawals : ${
      processingWithdrawals ? "✅" : "❌"
    }` +
    "\n" +
    `-# Minimum Withdrawal Amount : **${formattedMinimumWithdrawal} ${ticker.toUpperCase()}** (${
      getDecimalPlaces(effectiveMinimumWithdraw, currency.precision)
    } decimal places)` +
    "\n" +
    formatNetworkNotice(currency)
  );
}

/**
 * The floor a withdrawal must actually clear: the configured minimum plus the
 * current network fee estimate.
 *
 * <p>The fee is taken out of the amount sent, so a withdrawal at or below the
 * fee cannot be built at all. Keeping the two values separate lets
 * minimumWithdraw stay a stable policy figure - often the smallest atomic unit -
 * while the real floor tracks network conditions.
 */
function getEffectiveMinimumWithdraw(currency) {
  return new BigNumber(currency.minimumWithdraw ?? "0")
    .plus(new BigNumber(currency.feeEstimate ?? "0"))
    .toFixed(0);
}

/**
 * How many confirmations a currency settles after, or null when unspecified.
 * Nano and Banano are quorum-confirmed rather than depth-confirmed, so a single
 * confirmation is final for them.
 *
 * <p>Returned without markdown so callers can emphasise the whole sentence.
 * Bolding here as well produced nested `**` that Discord renders incorrectly.
 */
function formatConfirmationRequirement(currency) {
  const confirmations = Number(currency.confirmations ?? 0);
  if (!Number.isFinite(confirmations) || confirmations <= 0) {
    return null;
  }
  return `${confirmations} network confirmation${
    confirmations === 1 ? "" : "s"
  }`;
}

/**
 * Network characteristics a user should see before committing to a transfer:
 * what the fee costs them, and how long settlement takes. Deliberately not
 * small text - on a chain with fees the recipient gets less than the amount
 * requested. Driven entirely by the currency document.
 */
function formatNetworkNotice(currency) {
  const fee = currency.feeEstimate;
  const hasFee = fee && new BigNumber(fee).isGreaterThan(0);

  const confirmations = formatConfirmationRequirement(currency);
  const settlement = confirmations
    ? `\n**Settles after ${confirmations}.**`
    : "";

  if (!hasFee) {
    return (
      `### ⚡ **${currency.name} transactions are feeless — you receive exactly what is sent.**` +
      settlement
    );
  }

  const formattedFee = getCurrencyDecimalValue(fee, currency.precision);
  const feeDollarValue = getCurrencyDollarValue(
    formattedFee,
    currency.value,
    dollarValueDecimals,
  );
  return (
    `### ⚠️ **Network Fee: ~${formattedFee} ${currency.ticker.toUpperCase()} ≈ $${feeDollarValue}**` +
    "\n" +
    `**The fee is deducted from the amount you send, so the recipient receives slightly less than the requested amount.**` +
    settlement
  );
}

/**
 * Panels for the /currencies filter buttons: an overview followed by one panel
 * per enabled currency. Built from the currency list so a new coin needs no
 * change here.
 */
function buildCurrencyPanels(currencies, commands) {
  const enabled = getSortedEnabledCurrencies(currencies);
  const links = formatCurrencyCommandLinks(commands);

  const allPanel = {
    label: "ALL",
    title: `${EMOJIS.CURRENCY_COIN} ${COMMAND_DESCRIPTIONS.CURRENCIES}`,
    color: COLORS.NANOBOT_BLUE,
    content: links + enabled.map(formatCurrencyRow).join("\n"),
  };

  if (enabled.length < 2) {
    return [allPanel];
  }

  return [
    allPanel,
    ...enabled.map((currency) => ({
      label: currency.ticker.toUpperCase(),
      title: `${currency.emoji} ${currency.name} (${currency.ticker})`,
      color: currency.color,
      content: links + formatCurrencyRow(currency),
    })),
  ];
}

/**
 * Explorer link for an address, from the currency's own template.
 *
 * <p>Returns null when the currency has no template. Monero deliberately has
 * none: addresses never appear on chain, so there is nothing to link to, and the
 * previous hardcoded nanexplorer.com URL would have produced a dead link.
 */
function getExplorerAccountUrl(currency, address) {
  if (!currency?.explorerAccountUrl || !address) {
    return null;
  }
  return currency.explorerAccountUrl.replace("{value}", address);
}

/**
 * Explorer link for a transaction or block hash, from the currency's template.
 * Returns null when the currency is unknown or has no template, so callers can
 * fall back to plain text rather than emitting a dead link.
 */
function getExplorerTxUrl(currency, hash) {
  if (!currency?.explorerTxUrl || !hash) {
    return null;
  }
  return currency.explorerTxUrl.replace("{value}", hash);
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
  buildCurrencyChoices,
  buildCurrencyPanels,
  getCurrencyDollarValue,
  getCurrencyDecimalValue,
  getDollarsTotal,
  getDecimalPlaces,
  getEffectiveMinimumWithdraw,
  getExplorerAccountUrl,
  getExplorerTxUrl,
  getSortedEnabledCurrencies,
  formatConfirmationRequirement,
  formatCurrencies,
  formatCurrencyCommandLinks,
  formatCurrencyRow,
  formatNetworkNotice,
  formatCurrencyMessage,
  formatCurrencyTransferMessage,
  formatCurrencyReceiveMessage,
  formatCurrencySendMessage,
};
