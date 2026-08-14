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

function formatWallet(walletArray) {
  const noCurrencies = {
    name: "No Currencies",
    value: "\u200b",
    inline: true,
  };
  if (!Array.isArray(walletArray) || walletArray.length === 0) {
    return noCurrencies;
  }

  const filteredCurrencies = walletArray.filter(
    (currency) => currency && currency.enabled && currency.value !== "0",
  );

  if (filteredCurrencies.length === 0) {
    return noCurrencies;
  }

  const details = filteredCurrencies.map((walletInfo) => ({
    name: `${walletInfo.emoji} ${walletInfo.name ?? walletInfo.ticker}`,
    value: `> **${walletInfo.value} ${walletInfo.ticker}** ≈ $${
      walletInfo.dollarValue ?? "0"
    }`,
    inline: true,
  }));

  if (walletArray.length > 1) {
    details.push({
      name: EMOJIS.CURRENCY_COIN + " __**Estimated Currency Total (USD)**__",
      value: `> **$${getDollarsTotal(null, walletArray)}**`,
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
