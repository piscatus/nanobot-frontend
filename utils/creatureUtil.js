const { getCommandIds } = require("./commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("./constants.js");
const {
  getCurrencyDecimalValue,
  getCurrencyDollarValue,
} = require("./currencyUtil.js");

const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 30, EXPONENTIAL_AT: 31 });

const dollarValueDecimals = 8;

function getDecimalCreatureValue(
  wholeNumber,
  precision,
  quantity,
  multipliers,
) {
  let multiplier = "1";
  for (const bonus of multipliers) {
    if (new BigNumber(quantity).gte(new BigNumber(bonus.quantity))) {
      multiplier = bonus.name;
    } else {
      break;
    }
  }

  const result = new BigNumber(wholeNumber)
    .dividedBy(new BigNumber(10).pow(precision))
    .multipliedBy(new BigNumber(multiplier))
    .multipliedBy(new BigNumber(quantity));

  return result
    .toFixed(Number(precision))
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/(\.\d*?[1-9])?\.0+$/, "$1")
    .replace(/(?<=^|\D)0+(\.0+)?(?=\D|$)/g, function (p1) {
      return p1 || "0";
    });
}

/**
 * Returns the bulk sale bonus multiplier for a given quantity.
 * Bonuses are sorted by quantity threshold; the highest applicable multiplier is used.
 * @param {number} quantity - Creature quantity being sold
 * @param {Array} bonuses - Bonus list [{ name: "1.25", quantity: 10 }, ...]
 * @returns {string} Multiplier string (e.g. "1", "1.25", "2")
 */
function getBonusMultiplier(quantity, bonuses) {
  if (!Array.isArray(bonuses) || bonuses.length === 0) return "1";
  let multiplier = "1";
  for (const bonus of bonuses) {
    if (new BigNumber(quantity).gte(new BigNumber(bonus.quantity))) {
      multiplier = bonus.name;
    } else {
      break;
    }
  }
  return multiplier;
}

function formatCreatureCommands(commands) {
  return (
    formatCreatureTransferMessage(commands) +
    "\n" +
    formatCreatureBonusMessage(commands) +
    "\n" +
    formatCreatureFishingMessage(commands) +
    "\n" +
    formatCreatureInventoryMessage(commands) +
    "\n" +
    formatCreatureSaleMessage(commands)
  );
}

function formatCreatures(creaturesDB, currenciesDB) {
  const noCreatures = {
    name: "No Creatures",
    value: "\u200b",
    inline: true,
  };
  if (!Array.isArray(creaturesDB) || !Array.isArray(currenciesDB)) {
    return noCreatures;
  }

  const filteredCreatures = creaturesDB.filter((creature) => {
    const currency = currenciesDB.find((c) => c.ticker === creature.ticker);
    return currency && currency.enabled;
  });

  if (filteredCreatures.length === 0) {
    return noCreatures;
  }

  return filteredCreatures
    .map((creature) => {
      const currency = currenciesDB.find((c) => c.ticker === creature.ticker);
      const value = getCurrencyDecimalValue(creature.value, currency.precision);
      const dollarValue = new BigNumber(
        getCurrencyDollarValue(value, currency.value, dollarValueDecimals),
      );
      creature.actualValue = value;
      creature.dollarValue = dollarValue;
      return { ...creature, currency };
    })
    .sort((a, b) => {
      if (a.odds === b.odds) {
        return b.dollarValue.minus(a.dollarValue).toNumber();
      }
      return a.odds - b.odds;
    })
    .map((creature) => {
      const odds = new BigNumber(creature.odds).dividedBy(20).toString(10);
      return {
        name: `${creature.emoji} **${creature.name}** (${creature.pluralization})`,
        value: `Fish Odds: ${odds}%\nSale Value: **${
          creature.actualValue
        } ${creature.ticker.toUpperCase()}**\n≈ $${creature.dollarValue} ${
          creature.currency.emoji
        }`,
        inline: true,
      };
    });
}

/**
 * Panels for the /creatures filter buttons: an overview followed by one panel
 * per currency that actually has creatures. Tickers come from the creature list
 * rather than a fixed set, so a new currency appears automatically.
 */
function buildCreaturePanels(creatures, currencies, commands) {
  const description = formatCreatureCommands(commands);

  const allPanel = {
    label: "ALL",
    title: `${EMOJIS.CREATURES_FISH} ${COMMAND_DESCRIPTIONS.CREATURES}`,
    color: COLORS.NANOBOT_BLUE,
    content: description,
    list: formatCreatures(creatures, currencies),
  };

  if (!Array.isArray(creatures) || !Array.isArray(currencies)) {
    return [allPanel];
  }

  const enabledByTicker = new Map(
    currencies.filter((c) => c.enabled).map((c) => [c.ticker, c]),
  );

  const tickers = [
    ...new Set(
      creatures
        .map((creature) => creature.ticker)
        .filter((ticker) => enabledByTicker.has(ticker)),
    ),
  ].sort();

  // A single currency makes the filters redundant with the overview.
  if (tickers.length < 2) {
    return [allPanel];
  }

  return [
    allPanel,
    ...tickers.map((ticker) => {
      const currency = enabledByTicker.get(ticker);
      return {
        label: ticker.toUpperCase(),
        title: `${currency.emoji} ${currency.name} ${COMMAND_DESCRIPTIONS.CREATURES}`,
        color: currency.color,
        content: description,
        list: formatCreatures(
          creatures.filter((creature) => creature.ticker === ticker),
          currencies,
        ),
      };
    }),
  ];
}

function formatCreatureMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.CREATURES}:${
    commandMap[COMMAND_KEYS.CREATURES]
  }> to view detailed information about all creatures!`;
}

function formatCreatureFishingMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.FISH}:${
    commandMap[COMMAND_KEYS.FISH]
  }> to catch creatures from any server!`;
}

function formatCreatureInventoryMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.INVENTORY}:${
    commandMap[COMMAND_KEYS.INVENTORY]
  }> to view all caught creatures!`;
}

function formatCreatureTransferMessage(commands) {
  const commandMap = getCommandIds(commands);

  let message = `-# Use </${COMMAND_KEYS.DROP}:${commandMap[COMMAND_KEYS.DROP]}>, </${COMMAND_KEYS.GIFT}:${commandMap[COMMAND_KEYS.GIFT]}>, and </${COMMAND_KEYS.RAIN}:${commandMap[COMMAND_KEYS.RAIN]}> to transfer creatures to other users within a server!`;

  if (process.env.GUILD_INTENTS_GRANTED === "true") {
    message = `-# Use </${COMMAND_KEYS.AWARD}:${commandMap[COMMAND_KEYS.AWARD]}>, ${message.slice(3)}`;
  }

  return message;
}

function formatCreatureSaleMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.SELL}:${
    commandMap[COMMAND_KEYS.SELL]
  }> to exchange your creatures for currencies!`;
}

function formatCreatureBonusMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.BONUSES}:${
    commandMap[COMMAND_KEYS.BONUSES]
  }> to view all creature sale multipliers!`;
}

module.exports = {
  buildCreaturePanels,
  getBonusMultiplier,
  getDecimalCreatureValue,
  formatCreatureCommands,
  formatCreatures,
  formatCreatureMessage,
  formatCreatureFishingMessage,
  formatCreatureInventoryMessage,
  formatCreatureTransferMessage,
  formatCreatureSaleMessage,
  formatCreatureBonusMessage,
};
