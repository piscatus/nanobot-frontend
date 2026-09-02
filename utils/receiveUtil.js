const { getCommandIds } = require("./commandUtil.js");
const { COLORS, COMMAND_KEYS, EMOJIS } = require("./constants.js");
const {
  formatConfirmationRequirement,
  getExplorerAccountUrl,
  getSortedEnabledCurrencies,
} = require("./currencyUtil.js");

function findAddressByTicker(addresses, ticker) {
  return addresses.find(
    (addr) => addr.ticker.toUpperCase() === ticker.toUpperCase(),
  )?.address;
}

function getDepositsDisabledDesc(messageAuthor, currency) {
  return `### <@${messageAuthor}>, ${currency} deposits are currently disabled. Please try again later.`;
}

function getDepositAddressDesc(messageAuthor, currency, commands, address) {
  const commandMap = getCommandIds(commands);
  return (
    `### <@${messageAuthor}>, you can receive ${currency.toUpperCase()} into your Nanobot </${
      COMMAND_KEYS.WALLET
    }:${
      commandMap[COMMAND_KEYS.WALLET]
    }> by sending funds to your deposit address —` +
    "\n" +
    `\`${address}\`` +
    "\n" +
    `-# **Always** ensure your deposit address has not changed before sending funds!`
  );
}

function getSupportField() {
  return {
    name: "Users can join our Discord server for inquiries and support help:",
    value: process.env.HOME_SERVER_INVITE_URL,
  };
}

/**
 * Deposit warning field. Explorer links belong on the embed title (the same
 * pattern as /send and /update), so this field is free for settlement copy on
 * every currency - including Nano and Banano, which used to hide it behind the
 * account URL.
 */
function getDepositField(currency) {
  const warning = `Deposit **only** ${currency.ticker.toUpperCase()} ${
    currency.emoji
  } to this address, any other sent funds will be lost!`;

  const confirmations = formatConfirmationRequirement(currency);
  return {
    name: warning,
    value: confirmations
      ? `Deposits are credited after ${confirmations}.`
      : "Deposits are credited once confirmed on the network.",
  };
}

/**
 * One panel per enabled currency, ordered by ticker so the carousel buttons
 * read alphabetically. Sorting here rather than relying on the API's order
 * means adding a currency cannot quietly reshuffle the buttons, which matters
 * when the position of a deposit address is muscle memory.
 */
function buildReceivePanels(data, userId) {
  const { addresses, currencies, commands } = data;

  return getSortedEnabledCurrencies(currencies).map((currency) => {
    const address = findAddressByTicker(addresses ?? [], currency.ticker);

    // No address means the backend could not allocate one, for example a
    // wallet being unreachable. Treat it like disabled rather than rendering
    // an address that cannot receive funds.
    const unavailable = !currency.processDeposits || !address;

    return {
      label: currency.ticker.toUpperCase(),
      title: `${EMOJIS.DEPOSIT_INBOX} ${currency.name} Deposit Address`,
      // Clickable title, matching /send and /update. Null for Monero: addresses
      // never appear on chain, so there is nothing to link.
      url: unavailable ? null : getExplorerAccountUrl(currency, address),
      color: unavailable ? COLORS.ERROR_RED : currency.color,
      content: unavailable
        ? getDepositsDisabledDesc(userId, currency.name)
        : getDepositAddressDesc(userId, currency.name, commands, address),
      textContent: unavailable ? null : address,
      list: unavailable ? getSupportField() : getDepositField(currency),
    };
  });
}

module.exports = {
  buildReceivePanels,
  getDepositsDisabledDesc,
  getDepositAddressDesc,
  getDepositField,
};
