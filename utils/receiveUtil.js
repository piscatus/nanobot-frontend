const { getCommandIds } = require("./commandUtil.js");
const { COLORS, COMMAND_KEYS, EMOJIS } = require("./constants.js");

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

function buildReceiveSwapParams(data, userId) {
  const { addresses, currencies, commands } = data;

  const nanocurrency = currencies.find(
    (c) => c.name.toLowerCase() === "nano",
  );
  const bananocurrency = currencies.find(
    (c) => c.name.toLowerCase() === "banano",
  );

  const nanoDisabled =
    !nanocurrency.enabled || !nanocurrency.processDeposits;
  const bananoDisabled =
    !bananocurrency.enabled || !bananocurrency.processDeposits;

  const xnoAddress = findAddressByTicker(addresses, nanocurrency.ticker);
  const banAddress = findAddressByTicker(addresses, bananocurrency.ticker);

  const nanoDepositInfo = getDepositAddressDesc(
    userId,
    nanocurrency.name,
    commands,
    xnoAddress,
  );
  const bananoDepositInfo = getDepositAddressDesc(
    userId,
    bananocurrency.name,
    commands,
    banAddress,
  );

  const supportMessage =
    "Users can join our Discord server for inquiries and support help:";

  const nanoList = {
    name: `Deposit **only** XNO ${nanocurrency.emoji} to this address, any other sent funds will be lost!`,
    value: `https://nanexplorer.com/nano/account/${findAddressByTicker(
      addresses,
      "xno",
    )}`,
  };

  const bananoList = {
    name: `Deposit **only** BAN ${bananocurrency.emoji} to this address, any other sent funds will be lost!`,
    value: `https://nanexplorer.com/banano/account/${findAddressByTicker(
      addresses,
      "ban",
    )}`,
  };

  return {
    color1: nanoDisabled ? COLORS.ERROR_RED : nanocurrency.color,
    color2: bananoDisabled ? COLORS.ERROR_RED : bananocurrency.color,
    title1: `${EMOJIS.DEPOSIT_INBOX} Nano Deposit Address`,
    content1: nanoDisabled
      ? getDepositsDisabledDesc(userId, nanocurrency.name)
      : nanoDepositInfo,
    address1: nanoDisabled ? null : xnoAddress,
    field1: nanoDisabled
      ? { name: supportMessage, value: process.env.HOME_SERVER_INVITE_URL }
      : nanoList,
    title2: `${EMOJIS.DEPOSIT_INBOX} Banano Deposit Address`,
    content2: bananoDisabled
      ? getDepositsDisabledDesc(userId, bananocurrency.name)
      : bananoDepositInfo,
    address2: bananoDisabled ? null : banAddress,
    field2: bananoDisabled
      ? { name: supportMessage, value: process.env.HOME_SERVER_INVITE_URL }
      : bananoList,
  };
}

module.exports = {
  buildReceiveSwapParams,
  getDepositsDisabledDesc,
  getDepositAddressDesc,
};
