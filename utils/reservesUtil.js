const { getCommandIds } = require("./commandUtil.js");
const { formatWallet, getSortedWallet } = require("./walletUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("./constants.js");

function buildReservesEmbed(data) {
  const { currencies, guildWallets } = data;
  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: `${EMOJIS.BANK_SERVER} ${COMMAND_DESCRIPTIONS.RESERVES}`,
    description: reservesInfoTemplate(data.commands),
    fields: formatWallet(getSortedWallet(guildWallets, currencies)),
  });
}

function reservesInfoTemplate(commands) {
  const commandMap = getCommandIds(commands);
  return (
    `### Any user can </${COMMAND_KEYS.GIFT}:${
      commandMap[COMMAND_KEYS.GIFT]
    }> currencies to <@${
      process.env.BOT_USER_ID
    }> in this server to contribute to its fishing reserves.` +
    "\n" +
    `-# Server fishing reserves allow community members to </${
      COMMAND_KEYS.FISH
    }:${
      commandMap[COMMAND_KEYS.FISH]
    }> in this server and cannot be directly withdrawn by anyone. Contributed funds cannot be refunded!`
  );
}

module.exports = {
  buildReservesEmbed,
  reservesInfoTemplate,
};
