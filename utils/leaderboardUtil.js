const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const { getCommandIds } = require("./commandUtil.js");
const {
  BROWSE_WINDOW_MILLISECONDS,
  COMMAND_KEYS,
  EMOJIS,
  FILTER_ALL,
  MAXIMUM_SELECT_OPTIONS,
} = require("./constants.js");
const { buildEmbed } = require("./embedUtil.js");
const { safeDeferUpdate } = require("./interactionUtil.js");

/**
 * Discord wants a structured emoji on a select option, and custom emoji reach
 * us as "<:name:id>" text. Anything that will not parse is dropped instead of
 * being passed through, because one bad emoji is rejected for the whole payload
 * and would take the entire menu down with it.
 */
function toSelectEmoji(raw) {
  if (typeof raw !== "string" || raw.length === 0) {
    return undefined;
  }
  const custom = raw.match(/^<(a)?:(\w+):(\d+)>$/);
  if (custom) {
    return { animated: Boolean(custom[1]), name: custom[2], id: custom[3] };
  }
  return raw.includes("<") ? undefined : raw;
}

/** Creature categories inside one currency, keeping the map's ordering. */
function getScopedCategories(leaderboardData, ticker) {
  const keys = Object.keys(leaderboardData ?? {});
  if (!ticker || ticker === FILTER_ALL) {
    return keys;
  }
  return keys.filter((key) => leaderboardData[key]?.ticker === ticker);
}

/**
 * Currency choices for the scope menu.
 *
 * <p>A menu holds 25 options, so "All Currencies" is only offered while every
 * creature still fits in the creature menu beneath it. Once the roster outgrows
 * that, a currency has to be picked first. Scoping this way is what keeps every
 * creature reachable: four currencies of eight is 32 creatures, which no single
 * flat menu could ever list.
 */
function buildLeaderboardCurrencyOptions(leaderboardData, currencies) {
  const keys = Object.keys(leaderboardData ?? {});

  const byTicker = new Map(
    (currencies ?? [])
      .filter((currency) => currency?.ticker)
      .map((currency) => [currency.ticker.toUpperCase(), currency]),
  );

  const tickers = [
    ...new Set(
      keys.map((key) => leaderboardData[key]?.ticker).filter(Boolean),
    ),
  ].sort();

  const options = tickers.map((ticker) => {
    const currency = byTicker.get(ticker);
    const count = getScopedCategories(leaderboardData, ticker).length;
    return {
      value: ticker,
      label: currency?.name ? `${currency.name} [${ticker}]` : ticker,
      description: `${count} creature${count === 1 ? "" : "s"}`,
      emoji: toSelectEmoji(currency?.emoji),
    };
  });

  // With a single currency, "all" and that currency are the same board, so the
  // choice would be noise.
  if (tickers.length > 1 && keys.length <= MAXIMUM_SELECT_OPTIONS) {
    options.unshift({
      value: FILTER_ALL,
      label: "All Currencies",
      description: `${keys.length} creature${keys.length === 1 ? "" : "s"}`,
      emoji: EMOJIS.CURRENCY_COIN,
    });
  }

  return options.slice(0, MAXIMUM_SELECT_OPTIONS);
}

/** Creature choices in the current scope, each showing how many anglers rank. */
function buildLeaderboardCreatureOptions(leaderboardData, ticker) {
  return getScopedCategories(leaderboardData, ticker)
    .slice(0, MAXIMUM_SELECT_OPTIONS)
    .map((key) => {
      const category = leaderboardData[key];
      const anglers = category?.users?.length ?? 0;
      return {
        value: key,
        label: category?.name ?? key,
        description: `${anglers} angler${anglers === 1 ? "" : "s"}`,
        emoji: toSelectEmoji(category?.emoji),
      };
    });
}

/**
 * Where to open. An explicitly requested currency wins, then a requested
 * creature, then everything if it fits, and finally the first creature's
 * currency. A request that matches nothing falls back rather than opening on an
 * empty board.
 */
function resolveInitialState(
  leaderboardData,
  requestedTicker,
  requestedCreature,
) {
  const keys = Object.keys(leaderboardData ?? {});
  const allFits = keys.length <= MAXIMUM_SELECT_OPTIONS;
  const defaultTicker = allFits
    ? FILTER_ALL
    : leaderboardData[keys[0]]?.ticker ?? FILTER_ALL;

  const creature =
    requestedCreature && keys.includes(requestedCreature.toUpperCase())
      ? requestedCreature.toUpperCase()
      : null;

  let ticker = requestedTicker ? requestedTicker.toUpperCase() : null;

  if (!ticker && creature) {
    ticker = allFits ? FILTER_ALL : leaderboardData[creature].ticker;
  }

  if (!ticker || getScopedCategories(leaderboardData, ticker).length === 0) {
    ticker = defaultTicker;
  }

  const scoped = getScopedCategories(leaderboardData, ticker);

  return {
    ticker,
    category: creature && scoped.includes(creature) ? creature : scoped[0],
    currentPage: 0,
  };
}

/** Choices for the creature autocomplete, narrowed by what has been typed. */
function buildCreatureAutocompleteChoices(creatures, query, ticker) {
  const search = String(query ?? "")
    .trim()
    .toLowerCase();

  return (creatures ?? [])
    .filter((creature) => creature?.name)
    .filter(
      (creature) =>
        !ticker ||
        creature.ticker?.toUpperCase() === String(ticker).toUpperCase(),
    )
    .filter((creature) => creature.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAXIMUM_SELECT_OPTIONS)
    .map((creature) => ({
      name: creature.ticker
        ? `${creature.name} [${creature.ticker}]`
        : creature.name,
      value: creature.name.toUpperCase(),
    }));
}

/** Drops keys Discord rejects when absent rather than sending them undefined. */
function toSelectOption(option, selectedValue) {
  const built = {
    label: option.label,
    value: option.value,
    default: option.value === selectedValue,
  };
  if (option.description) {
    built.description = option.description;
  }
  if (option.emoji) {
    built.emoji = option.emoji;
  }
  return built;
}

function buildLeaderboardData(responseData) {
  const { currencies, creatures, leaderboards } = responseData;

  const enabledTickers = new Set();
  const tickerColorMap = {};

  currencies.forEach((currency) => {
    const ticker = currency.ticker.toUpperCase();
    tickerColorMap[ticker] = currency.color;
    if (currency.enabled) {
      enabledTickers.add(ticker);
    }
  });

  const creatureMap = {};
  creatures.forEach((creature) => {
    creatureMap[creature.name.toUpperCase()] = creature;
  });

  const itemMap = {};

  leaderboards.forEach((user) => {
    user.items.forEach((item) => {
      const itemName = item.name.toUpperCase();
      const creature = creatureMap[itemName];

      if (!creature) return;

      const creatureTicker = creature.ticker?.toUpperCase();
      if (
        item.quantity > 0 &&
        creatureTicker &&
        enabledTickers.has(creatureTicker)
      ) {
        if (!itemMap[itemName]) {
          itemMap[itemName] = [];
        }
        itemMap[itemName].push({
          userId: user.userId,
          quantity: item.quantity,
          timestamp: item.timestamp,
        });
      }
    });
  });

  Object.keys(itemMap).forEach((itemName) => {
    itemMap[itemName].sort((a, b) => {
      if (b.quantity !== a.quantity) {
        return b.quantity - a.quantity;
      }
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  });

  const sortedItemEntries = Object.entries(itemMap).sort((a, b) => {
    const creatureA = creatures.find((p) => p.name.toUpperCase() === a[0]);
    const creatureB = creatures.find((p) => p.name.toUpperCase() === b[0]);

    const oddsA = creatureA?.odds ?? Infinity;
    const oddsB = creatureB?.odds ?? Infinity;

    if (oddsA !== oddsB) {
      return oddsA - oddsB;
    }

    const tickerA = creatureA?.ticker ?? "";
    const tickerB = creatureB?.ticker ?? "";

    return tickerA.localeCompare(tickerB);
  });

  const sortedItemMap = {};

  sortedItemEntries.forEach(([itemName, users]) => {
    const creature = creatures.find(
      (p) => p.name.toUpperCase() === itemName,
    );
    const ticker = creature?.ticker?.toUpperCase();
    const color = ticker ? tickerColorMap[ticker] : null;

    sortedItemMap[itemName] = {
      color,
      emoji: creature?.emoji,
      name: creature?.name,
      pluralization: creature?.pluralization,
      ticker,
      users,
    };
  });

  return sortedItemMap;
}

async function leaderboardCollectorCreator(
  client,
  interaction,
  interactionReply,
  ids,
  title,
  leaderboardData,
  commands,
  state,
  pageSize,
  buildComponents,
  userId,
) {
  const filter = (i) =>
    Object.values(ids).includes(i.customId) &&
    i.user.id === interaction.user.id;

  const collector = interactionReply.createMessageComponentCollector({
    filter,
    time: BROWSE_WINDOW_MILLISECONDS,
  });

  collector.on("collect", async (i) => {
    const uid = i.user.id;

    const cooldownExpiry = client.buttonCooldowns.get(uid);
    if (cooldownExpiry && Date.now() < cooldownExpiry) return;

    client.buttonCooldowns.set(uid, Date.now() + 1000);

    if (!(await safeDeferUpdate(i))) return;

    // Wrapping stays inside the chosen currency, so it can never carry the
    // board somewhere the menus above it say you are not.
    const scoped = getScopedCategories(leaderboardData, state.ticker);
    const position = Math.max(scoped.indexOf(state.category), 0);
    const users = leaderboardData[state.category]?.users ?? [];
    const maxPage = Math.max(Math.ceil(users.length / pageSize) - 1, 0);

    switch (i.customId) {
      case ids.currency: {
        state.ticker = i.values?.[0] ?? FILTER_ALL;
        state.category = getScopedCategories(leaderboardData, state.ticker)[0];
        state.currentPage = 0;
        break;
      }

      case ids.creature:
        state.category = i.values?.[0] ?? state.category;
        state.currentPage = 0;
        break;

      case ids.wrapLeft:
        state.category =
          scoped[(position - 1 + scoped.length) % scoped.length];
        state.currentPage = 0;
        break;

      case ids.wrapRight:
        state.category = scoped[(position + 1) % scoped.length];
        state.currentPage = 0;
        break;

      case ids.userRank: {
        const userIndex = users.findIndex((u) => u.userId === uid);

        if (userIndex !== -1) {
          state.currentPage = Math.floor(userIndex / pageSize);
        }
        break;
      }

      case ids.left:
        state.currentPage = Math.max(state.currentPage - 1, 0);
        break;

      case ids.right:
        state.currentPage = Math.min(state.currentPage + 1, maxPage);
        break;
    }

    const newEmbed = getLeaderboardEmbed(
      title,
      leaderboardData,
      commands,
      state,
      userId,
    );

    await interaction.editReply({
      embeds: [newEmbed],
      components: buildComponents(),
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {
      console.error("leaderboardUtil collector end editReply", e);
    }
  });
}

function getLeaderboardEmbed(title, data, commands, state, userId) {
  const pageSize = 10;
  const categoryData = data?.[state.category];
  const leaderboard = categoryData?.users;
  const commandMap = getCommandIds(commands);
  let myQuantity = null;
  let myRank = null;

  if (!leaderboard || leaderboard.length === 0) {
    return buildEmbed({
      title: title,
      description:
        `Use </${COMMAND_KEYS.FISH}:${
          commandMap[COMMAND_KEYS.FISH]
        }> to compete!\n` + `## No Leaderboard Data`,
      error: true,
    });
  }

  for (let i = 0; i < leaderboard.length; i++) {
    const myUserData = leaderboard[i];
    if (myUserData.userId === userId) {
      myQuantity = myUserData.quantity;
      myRank = i + 1;
      break;
    }
  }

  const color = categoryData?.color;
  const emoji = categoryData?.emoji;
  const name = categoryData?.name;
  const pluralization = categoryData?.pluralization;

  const start = state.currentPage * pageSize;
  const page = leaderboard.slice(start, start + pageSize);
  const totalPages = Math.ceil(leaderboard.length / pageSize);

  let fields = [];

  page.forEach((user, i) => {
    const isSelf = user.userId === userId;
    fields.push({
      name: `${isSelf ? "**" : ""}Caught: ${user.quantity}${
        isSelf ? "**" : ""
      }`,
      value: `${isSelf ? "**" : ""}#${start + i + 1} – <@${user.userId}>${
        isSelf ? "**" : ""
      }`,
      inline: false,
    });
  });

  return buildEmbed({
    color: color,
    title: EMOJIS.LEVEL_CHARTS + " " + title,
    description:
      `Use </${COMMAND_KEYS.FISH}:${
        commandMap[COMMAND_KEYS.FISH]
      }> to compete!\n` +
      `## ${name} ${emoji}\n` +
      (myRank != null
        ? `Your rank is **#${myRank}**. You have caught ${myQuantity} ${
            myQuantity === 1 ? name : pluralization
          }!`
        : ""),
    fields: fields,
    footer: `Page ${state.currentPage + 1} of ${totalPages}`,
  });
}

exports.buildLeaderboardData = buildLeaderboardData;
exports.buildCreatureAutocompleteChoices = buildCreatureAutocompleteChoices;
exports.buildLeaderboardCreatureOptions = buildLeaderboardCreatureOptions;
exports.buildLeaderboardCurrencyOptions = buildLeaderboardCurrencyOptions;
exports.getScopedCategories = getScopedCategories;
exports.resolveInitialState = resolveInitialState;

exports.paginateLeaderboard = async function (
  interaction,
  client,
  title,
  leaderboardData,
  commands,
  userId,
  currencies,
  requestedTicker = null,
  requestedCreature = null,
) {
  const pageSize = 10;

  const state = resolveInitialState(
    leaderboardData,
    requestedTicker,
    requestedCreature,
  );

  const currencyOptions = buildLeaderboardCurrencyOptions(
    leaderboardData,
    currencies,
  );

  const ids = {
    currency: uuidv4(),
    creature: uuidv4(),
    wrapLeft: uuidv4(),
    left: uuidv4(),
    userRank: uuidv4(),
    right: uuidv4(),
    wrapRight: uuidv4(),
  };

  const buildComponents = () => {
    const rows = [];

    // One currency is not a choice, so the menu only earns its row once there
    // is somewhere else to go.
    if (currencyOptions.length > 1) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(ids.currency)
            .setPlaceholder("Filter by currency")
            .addOptions(
              currencyOptions.map((option) =>
                toSelectOption(option, state.ticker),
              ),
            ),
        ),
      );
    }

    const creatureOptions = buildLeaderboardCreatureOptions(
      leaderboardData,
      state.ticker,
    );

    if (creatureOptions.length > 1) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(ids.creature)
            .setPlaceholder("Jump to a creature")
            .addOptions(
              creatureOptions.map((option) =>
                toSelectOption(option, state.category),
              ),
            ),
        ),
      );
    }

    const users = leaderboardData?.[state.category]?.users ?? [];
    const totalPages = Math.max(Math.ceil(users.length / pageSize), 1);
    const atFirst = state.currentPage <= 0;
    const atLast = state.currentPage >= totalPages - 1;
    const singleCreature = creatureOptions.length < 2;

    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(ids.wrapLeft)
          .setLabel(EMOJIS.REWIND_ARROW)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(singleCreature),
        new ButtonBuilder()
          .setCustomId(ids.left)
          .setLabel(EMOJIS.BACK_ARROW)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(atFirst),
        new ButtonBuilder()
          .setCustomId(ids.userRank)
          .setLabel(EMOJIS.RECEIVER_BULLSEYE)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(ids.right)
          .setLabel(EMOJIS.FORWARD_ARROW)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(atLast),
        new ButtonBuilder()
          .setCustomId(ids.wrapRight)
          .setLabel(EMOJIS.FASTFORWARD_ARROW)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(singleCreature),
      ),
    );

    return rows;
  };

  const embed = getLeaderboardEmbed(
    title,
    leaderboardData,
    commands,
    state,
    userId,
  );

  const replyEmbed = await interaction.editReply({
    embeds: [embed],
    components: buildComponents(),
    fetchReply: true,
  });

  await leaderboardCollectorCreator(
    client,
    interaction,
    replyEmbed,
    ids,
    title,
    leaderboardData,
    commands,
    state,
    pageSize,
    buildComponents,
    userId,
  );
};
