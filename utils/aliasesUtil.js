const {
  getCurrencyDecimalValue,
  getCurrencyDollarValue,
} = require("./currencyUtil.js");
const { getCommandIds } = require("./commandUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const { capitalize } = require("./stringUtil.js");

const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
} = require("./constants.js");

const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 30, EXPONENTIAL_AT: 10 });

const dollarValueDecimals = 8;
const dollarToCryptoDecimalPlaces = 8;

/** Matches backend resolution for alias {@code input} (e.g. {@code $1 nano}). */
function rawAmountFromAliasInput(aliasInput, currency) {
  if (!aliasInput || !currency) {
    return null;
  }
  const tokens = aliasInput.trim().split(" ").filter(Boolean);
  if (tokens.length < 2) {
    return null;
  }
  const numberStr = tokens[0];
  const factor = new BigNumber(10).pow(currency.precision);
  const lead = numberStr.startsWith("$");
  const trail = numberStr.endsWith("$");
  if (lead !== trail) {
    const numeric = new BigNumber(lead ? numberStr.slice(1) : numberStr.slice(0, -1));
    if (numeric.isNaN()) {
      return null;
    }
    const cryptoHuman = numeric
      .dividedBy(new BigNumber(currency.value))
      .decimalPlaces(dollarToCryptoDecimalPlaces, BigNumber.ROUND_DOWN);
    return cryptoHuman
      .multipliedBy(factor)
      .integerValue(BigNumber.ROUND_DOWN)
      .toFixed(0);
  }
  const native = new BigNumber(numberStr);
  if (native.isNaN()) {
    return null;
  }
  return native.multipliedBy(factor).toFixed(0);
}

function formatAliases(aliasesDB, currenciesDB) {
  const noAliases = {
    name: "No Aliases",
    value: "\u200b",
    inline: true,
  };
  if (!Array.isArray(aliasesDB) || !Array.isArray(currenciesDB)) {
    return noAliases;
  }

  const filteredAliases = aliasesDB.filter((alias) => {
    const currency = currenciesDB.find((c) => c.ticker === alias.ticker);
    return currency && currency.enabled; // Filter out disabled currencies
  });

  if (filteredAliases.length === 0) {
    return noAliases;
  }

  return filteredAliases
    .map((alias) => {
      const currency = currenciesDB.find((c) => c.ticker === alias.ticker);
      let effectiveRaw = alias.value;
      if (alias.input != null && String(alias.input).trim() !== "") {
        const computed = rawAmountFromAliasInput(alias.input, currency);
        if (computed == null) {
          return null;
        }
        effectiveRaw = computed;
      }
      let aliasDecimalValue = getCurrencyDecimalValue(
        effectiveRaw,
        currency.precision,
      );
      if (alias.input != null && String(alias.input).trim() !== "") {
        aliasDecimalValue = new BigNumber(aliasDecimalValue)
          .decimalPlaces(dollarToCryptoDecimalPlaces, BigNumber.ROUND_DOWN)
          .toFixed()
          .replace(/(\.\d*?[1-9])0+$/, "$1")
          .replace(/(\.\d*?[1-9])?\.0+$/, "$1");
      }
      const aliasDollarValue = new BigNumber(
        getCurrencyDollarValue(
          aliasDecimalValue,
          currency.value,
          dollarValueDecimals,
        ),
      );
      alias.actualValue = aliasDecimalValue;
      alias.dollarValue = aliasDollarValue;
      return { ...alias, currency };
    })
    .filter(Boolean)
    .sort((a, b) => b.dollarValue.minus(a.dollarValue).toNumber())
    .map((alias) => {
      const hasInput =
        alias.input != null && String(alias.input).trim() !== "";
      const cryptoPart = `${alias.actualValue} ${alias.ticker.toUpperCase()}`;
      const dollarStr = `$${alias.dollarValue.toString()}`;
      const value = hasInput
        ? `Value: ${cryptoPart} (at current rates)\n≈ **${dollarStr}** ${alias.currency.emoji}`
        : `Value: **${cryptoPart}**\n≈ ${dollarStr} ${alias.currency.emoji}`;
      return {
        name: `${alias.emoji} **${alias.singular}** (${alias.plural})`,
        value,
        inline: true,
      };
    });
}

function formatDMErrorMessage() {
  return "Server Aliases can only be viewed from within a server!";
}

function formatGlobalMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    `-# Global Aliases can be viewed with </${COMMAND_KEYS.ALIASES} ${
      COMMAND_OPTION_KEYS.GLOBAL
    }:${commandMap[COMMAND_KEYS.ALIASES]}>.` +
    "\n" +
    `-# Server Aliases can be created with </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.ADD_ALIAS
    }:${commandMap[COMMAND_KEYS.CONFIG]}>.` +
    "\n" +
    `-# Server Aliases can be deleted with </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.REMOVE_ALIAS
    }:${commandMap[COMMAND_KEYS.CONFIG]}>.` +
    "\n"
  );
}

function formatServerMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Server Aliases can be viewed with </${COMMAND_KEYS.ALIASES} ${
    COMMAND_OPTION_KEYS.SERVER
  }:${commandMap[COMMAND_KEYS.ALIASES]}>.`;
}

function formatAliasMessage(intro, location, commands) {
  const commandMap = getCommandIds(commands);

  let message = `-# ${intro} can be used ${location} with </${COMMAND_KEYS.DROP}:${commandMap[COMMAND_KEYS.DROP]}>, </${COMMAND_KEYS.GIFT}:${commandMap[COMMAND_KEYS.GIFT]}>, and </${COMMAND_KEYS.RAIN}:${commandMap[COMMAND_KEYS.RAIN]}>!`;

  if (process.env.GUILD_INTENTS_GRANTED === "true") {
    message = `-# ${intro} can be used ${location} with </${COMMAND_KEYS.AWARD}:${commandMap[COMMAND_KEYS.AWARD]}>, ${message.slice(2)}`;
  }

  return message;
}

/** Shared title and description so the embed and the filter panels agree. */
function buildAliasesHeader(subcommand, guildId, data) {
  let embedContent = "\n\n";

  const serverAliases = `${capitalize(COMMAND_OPTION_KEYS.SERVER)} ${capitalize(COMMAND_KEYS.ALIASES)}`;
  let intro = `${capitalize(COMMAND_OPTION_KEYS.GLOBAL)} ${capitalize(COMMAND_KEYS.ALIASES)}`;
  let location = "anywhere";

  if (subcommand === COMMAND_OPTION_KEYS.SERVER) {
    intro = serverAliases;
    location = "in this server";
    embedContent += formatGlobalMessage(data.commands);
  } else if (guildId != null) {
    embedContent += formatServerMessage(data.commands) + "\n";
  }
  embedContent += formatAliasMessage(intro, location, data.commands);

  const emoji =
    subcommand === COMMAND_OPTION_KEYS.GLOBAL
      ? EMOJIS.ALIASES_GLOBE
      : EMOJIS.ALIASES_HOME;
  const title = `${emoji} ${capitalize(subcommand)} ${COMMAND_DESCRIPTIONS.ALIASES}`;

  return { title, description: embedContent };
}

function buildAliasesEmbed(subcommand, guildId, data) {
  const { title, description } = buildAliasesHeader(subcommand, guildId, data);

  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title,
    description,
    fields: formatAliases(data.aliases, data.currencies),
  });
}

/**
 * Filter panels for /aliases: an overview plus one panel per currency that
 * actually has aliases. Tickers come from the alias list, so a currency with no
 * aliases gets no panel and a new currency appears on its own.
 */
function buildAliasesPanels(subcommand, guildId, data) {
  const { title, description } = buildAliasesHeader(subcommand, guildId, data);
  const { aliases, currencies } = data;

  const allPanel = {
    label: "ALL",
    title,
    color: COLORS.NANOBOT_BLUE,
    content: description,
    list: formatAliases(aliases, currencies),
  };

  if (!Array.isArray(aliases) || !Array.isArray(currencies)) {
    return [allPanel];
  }

  const enabledByTicker = new Map(
    currencies.filter((c) => c.enabled).map((c) => [c.ticker, c]),
  );

  const tickers = [
    ...new Set(
      aliases
        .map((alias) => alias.ticker)
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
        title: `${currency.emoji} ${currency.name} ${COMMAND_DESCRIPTIONS.ALIASES}`,
        color: currency.color,
        content: description,
        list: formatAliases(
          aliases.filter((alias) => alias.ticker === ticker),
          currencies,
        ),
      };
    }),
  ];
}

module.exports = {
  buildAliasesEmbed,
  buildAliasesPanels,
  formatAliases,
  rawAmountFromAliasInput,
  formatAliasMessage,
  formatDMErrorMessage,
  formatGlobalMessage,
  formatServerMessage,
};
