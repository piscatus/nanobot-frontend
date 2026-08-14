const { getCommandIds } = require("./commandUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

function formatBonuses(bonuses) {
  return bonuses.map((bonus) => {
    const quantity = bonus.quantity;
    const name = bonus.name;
    const cleanedName = parseFloat(name).toString();

    return {
      name: `Sale of *${quantity}+*`,
      value: `Bonus : **${cleanedName}X Sale Multiplier**`,
      inline: true,
    };
  });
}

function formatBonusesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Users receive various multipliers based on the quantities they </${
    COMMAND_KEYS.SELL
  }:${commandMap[COMMAND_KEYS.SELL]}>!`;
}

module.exports = {
  formatBonuses,
  formatBonusesMessage,
};
