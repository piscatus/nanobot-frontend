const dollarValueDecimals = 8;
const { EMOJIS } = require("./constants.js");
const {
  getCurrencyDecimalValue,
  getCurrencyDollarValue,
  getDollarsTotal,
} = require("./currencyUtil.js");

function getSortedWallet(wallets, currencies) {
  if (!wallets) return null;

  const mapped = wallets
    .map((wallet) => getCurrencyInfo(wallet, currencies))
    .filter((c) => c !== null);

  return mapped.sort(
    (a, b) => b.dollarValue - a.dollarValue || a.name.localeCompare(b.name),
  );
}

function getCurrencyInfo(wallet, currencies) {
  const currency = currencies.find(
    (currency) => currency.ticker === wallet.ticker,
  );

  if (!currency) return null;

  const decimalValue = getCurrencyDecimalValue(
    wallet.raw,
    Number(currency.precision),
  );

  return {
    emoji: currency.emoji,
    enabled: currency.enabled,
    value: decimalValue,
    dollarValue: getCurrencyDollarValue(
      decimalValue,
      currency.value,
      dollarValueDecimals,
    ),
    name: currency.name,
    ticker: currency.ticker,
  };
}

const CONCEALED_PLACEHOLDER = "?????";

/**
 * @param {Array} walletArray - output of getSortedWallet
 * @param {boolean} [includeZeroBalances] - keep entries worth zero. Off for user
 *   facing balances, where empty currencies are noise, but on for the audit hot
 *   wallet view, where "we hold none of this" is the point.
 * @param {Set<string>} [concealedTickers] - tickers whose amounts are replaced
 *   with a placeholder. Concealed entries are also left out of the USD total,
 *   because a total that included them could be differenced against the visible
 *   rows to recover the hidden amount.
 */
function formatWallet(
  walletArray,
  includeZeroBalances = false,
  concealedTickers = null,
) {
  const noCurrencies = {
    name: "No Currencies",
    value: "\u200b",
    inline: true,
  };
  if (!Array.isArray(walletArray) || walletArray.length === 0) {
    return noCurrencies;
  }

  const isConcealed = (ticker) =>
    Boolean(concealedTickers && concealedTickers.has(ticker));

  const filteredCurrencies = walletArray.filter(
    (currency) =>
      currency &&
      currency.enabled &&
      // A concealed currency is always listed. Hiding the row entirely when the
      // balance happens to be zero would itself disclose the balance.
      (includeZeroBalances ||
        currency.value !== "0" ||
        isConcealed(currency.ticker)),
  );

  if (filteredCurrencies.length === 0) {
    return noCurrencies;
  }

  const details = filteredCurrencies.map((walletInfo) => ({
    name: `${walletInfo.emoji} ${walletInfo.name ?? walletInfo.ticker}`,
    value: isConcealed(walletInfo.ticker)
      ? `> **${CONCEALED_PLACEHOLDER} ${walletInfo.ticker}** ≈ $${CONCEALED_PLACEHOLDER}`
      : `> **${walletInfo.value} ${walletInfo.ticker}** ≈ $${
          walletInfo.dollarValue ?? "0"
        }`,
    inline: true,
  }));

  if (walletArray.length > 1) {
    const disclosed = walletArray.filter(
      (walletInfo) => !isConcealed(walletInfo.ticker),
    );
    const hasConcealed = disclosed.length !== walletArray.length;
    details.push({
      name:
        EMOJIS.CURRENCY_COIN +
        (hasConcealed
          ? " __**Estimated Currency Total (USD, public currencies only)**__"
          : " __**Estimated Currency Total (USD)**__"),
      value: `> **$${getDollarsTotal(null, disclosed)}**`,
      inline: false,
    });
  }

  return details;
}

module.exports = {
  getSortedWallet,
  getCurrencyInfo,
  formatWallet,
};
