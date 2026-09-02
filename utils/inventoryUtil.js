const dollarValueDecimals = 8;
const { formatMergeMessage } = require("./commandUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  EMOJIS,
} = require("./constants.js");
const { isValidString } = require("./stringUtil.js");
const {
  formatCreatureBonusMessage,
  formatCreatureFishingMessage,
  formatCreatureMessage,
  formatCreatureSaleMessage,
  formatCreatureTransferMessage,
  getDecimalCreatureValue,
} = require("./creatureUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const {
  getCurrencyDollarValue,
  getDollarsTotal,
} = require("./currencyUtil.js");

const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 30, EXPONENTIAL_AT: 10 });

function getSortedInventory(items, creatures, currencies, bonuses) {
  if (!items) return null;

  const mapped = items
    .map((item) => getItemInfo(item, creatures, currencies, bonuses))
    .filter((i) => i && typeof i.name === "string");

  return mapped.sort(
    (a, b) =>
      b.quantity - a.quantity ||
      b.dollarValue - a.dollarValue ||
      a.name.localeCompare(b.name),
  );
}

function getItemInfo(item, creatures, currencies, bonuses) {
  if (!creatures || !currencies) return null;

  if (!item || !item.name) return null;

  const creature = creatures.find(
    (creature) => creature.name.toUpperCase() === item.name.toUpperCase(),
  );
  if (!creature) return null;

  const currency = currencies.find(
    (currency) => currency.ticker === creature.ticker,
  );
  if (!currency || !currency.enabled) return null;

  const decimalValue = getDecimalCreatureValue(
    creature.value,
    currency.precision,
    item.quantity,
    bonuses,
  );

  return {
    name: creature.name,
    pluralization: creature.pluralization,
    quantity: item.quantity,
    capacity: creature.capacity,
    value: decimalValue,
    odds: creature.odds,
    currencyName: currency.name,
    creatureTicker: creature.ticker,
    creatureEmoji: creature.emoji,
    currencyEmoji: currency.emoji,
    currencyValue: currency.value,
    dollarValue: getCurrencyDollarValue(
      decimalValue,
      currency.value,
      dollarValueDecimals,
    ),
  };
}

function formatInventory(itemArray, displayCapacity) {
  const noCreatures = {
    name: "No Creatures",
    value: "\u200b",
    inline: true,
  };

  if (!Array.isArray(itemArray) || itemArray.length === 0) {
    return noCreatures;
  }

  const filtered = itemArray.filter(
    (item) => item && item.name && item.quantity > 0,
  );

  if (filtered.length === 0) return noCreatures;

  const details = filtered.map((itemInfo) => {
    const itemName =
      itemInfo.quantity === 1 ? itemInfo.name : itemInfo.pluralization;

    return {
      name: `${itemInfo.creatureEmoji} **${itemInfo.quantity}** ${
        displayCapacity ? `/ ${itemInfo.capacity} ` : ""
      }**${itemName}**`,
      value: `> Sell Value: **${itemInfo.value} ${itemInfo.currencyName}** ${itemInfo.currencyEmoji} (${itemInfo.creatureTicker}) ≈ $${itemInfo.dollarValue}`,
      inline: true,
    };
  });

  if (itemArray.length > 1) {
    details.push({
      name: EMOJIS.CREATURES_FISH + " __**Estimated Creature Total (USD)**__",
      value: `> **$${getDollarsTotal(filtered, null)}**`,
      inline: false,
    });
  }

  return details;
}

function getInventorySaleWallet(items, creatures, currencies, bonuses) {
  if (!items || items.length === 0) return [];

  const walletTotals = {};

  for (const item of items) {
    const itemInfo = getItemInfo(item, creatures, currencies, bonuses);
    if (!itemInfo) continue;

    const ticker = itemInfo.creatureTicker;
    const rawValue = new BigNumber(itemInfo.value); // total already includes quantity

    const currency = currencies.find((c) => c.ticker === ticker);
    if (!currency) continue;

    const precisionMultiplier = new BigNumber(10).pow(currency.precision);

    const totalRaw = rawValue.times(precisionMultiplier);
    walletTotals[ticker] = (walletTotals[ticker] || new BigNumber(0)).plus(
      totalRaw,
    );
  }

  return Object.entries(walletTotals).map(([ticker, raw]) => ({
    ticker,
    raw: raw.toFixed(0),
  }));
}

function formatInventoryContent(commands) {
  return (
    formatCreatureBonusMessage(commands) +
    "\n" +
    formatCreatureMessage(commands) +
    "\n" +
    formatCreatureFishingMessage(commands)
  );
}

/** Distinct currency tickers present in a sorted inventory array. */
function getInventoryTickers(itemArray) {
  if (!Array.isArray(itemArray)) return [];
  return [
    ...new Set(
      itemArray
        .filter((item) => item && item.quantity > 0)
        .map((item) => item.creatureTicker),
    ),
  ].sort();
}

/**
 * ALL panel plus one per currency present, for a single inventory owner.
 * Filters are omitted when the inventory spans fewer than two currencies, since
 * they would just duplicate the overview.
 */
function buildOwnerPanels(options) {
  const { itemArray, title, description, displayCapacity, labelPrefix } =
    options;

  const panels = [
    {
      label: `${labelPrefix}ALL`,
      title,
      color: COLORS.NANOBOT_BLUE,
      content: description,
      list: formatInventory(itemArray, displayCapacity),
    },
  ];

  const tickers = getInventoryTickers(itemArray);
  if (tickers.length < 2) {
    return panels;
  }

  for (const ticker of tickers) {
    panels.push({
      label: `${labelPrefix}${ticker.toUpperCase()}`,
      title,
      color: COLORS.NANOBOT_BLUE,
      content: description,
      list: formatInventory(
        itemArray.filter((item) => item.creatureTicker === ticker),
        displayCapacity,
      ),
    });
  }
  return panels;
}

/**
 * Panels for the /inventory filter buttons.
 *
 * <p>When a subordinate account is linked, its panels are appended with a SUB
 * prefix rather than merged into the same embed. Merging would risk exceeding
 * Discord's 25 field limit on the unfiltered view, since each creature type is
 * its own field.
 */
function buildInventoryPanels(data, username) {
  const { bonuses, commands, creatures, currencies, userDetails } = data;
  const subordinateUserId = userDetails?.subordinateUserId ?? null;

  const userItemArray = getSortedInventory(
    data.userItems,
    creatures,
    currencies,
    bonuses,
  );

  const sellNote =
    userItemArray?.length > 0 ? formatCreatureSaleMessage(commands) : "";
  const transferNote =
    userItemArray?.length > 0 ? formatCreatureTransferMessage(commands) : "";

  const actionMessages =
    `${transferNote}` +
    "\n" +
    `${formatInventoryContent(commands)}` +
    "\n" +
    `${sellNote}`;

  const title = `${EMOJIS.INVENTORY_CABINET} ${username}'s ${COMMAND_DESCRIPTIONS.INVENTORY}`;

  const panels = buildOwnerPanels({
    itemArray: userItemArray,
    title,
    description: actionMessages,
    displayCapacity: true,
    labelPrefix: "",
  });

  if (!isValidString(subordinateUserId)) {
    return panels;
  }

  const subordinateItemArray = getSortedInventory(
    data.subordinateItems,
    creatures,
    currencies,
    bonuses,
  );

  panels.push(
    ...buildOwnerPanels({
      itemArray: subordinateItemArray,
      title: `${EMOJIS.SUBORDINATE} Subordinate's ${COMMAND_DESCRIPTIONS.INVENTORY}`,
      description: formatMergeMessage(
        commands,
        subordinateUserId,
        COMMAND_KEYS.CREATURES,
        COMMAND_KEYS.INVENTORY,
      ),
      displayCapacity: false,
      labelPrefix: "SUB ",
    }),
  );

  return panels;
}

function buildInventoryEmbed(data, username) {
  const { bonuses, commands, creatures, currencies, userDetails } = data;

  const subordinateUserId = userDetails?.subordinateUserId ?? null;
  const userItemArray = getSortedInventory(
    data.userItems,
    creatures,
    currencies,
    bonuses,
  );

  const userInfo = formatInventory(userItemArray, true);

  const sellNote =
    userItemArray?.length > 0
      ? formatCreatureSaleMessage(commands)
      : "";
  const transferNote =
    userItemArray?.length > 0
      ? formatCreatureTransferMessage(commands)
      : "";

  const actionMessages =
    `${transferNote}` +
    "\n" +
    `${formatInventoryContent(commands)}` +
    "\n" +
    `${sellNote}`;

  const title =
    EMOJIS.INVENTORY_CABINET +
    " " +
    username +
    "'s " +
    COMMAND_DESCRIPTIONS.INVENTORY;

  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title,
    description: actionMessages,
    fields: userInfo,
  });
}

module.exports = {
  buildInventoryEmbed,
  buildInventoryPanels,
  getInventoryTickers,
  formatInventory,
  formatInventoryContent,
  getInventorySaleWallet,
  getItemInfo,
  getSortedInventory,
};
