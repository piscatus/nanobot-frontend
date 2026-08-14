const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const { getCommandIds } = require("./commandUtil.js");
const { COMMAND_KEYS, EMOJIS } = require("./constants.js");
const { buildEmbed } = require("./embedUtil.js");

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
  categories,
  state,
  pageSize,
  buildRow,
  userId,
) {
  const filter = (i) =>
    Object.values(ids).includes(i.customId) &&
    i.user.id === interaction.user.id;

  const collector = interactionReply.createMessageComponentCollector({
    filter,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    const uid = i.user.id;

    const cooldownExpiry = client.buttonCooldowns.get(uid);
    if (cooldownExpiry && Date.now() < cooldownExpiry) return;

    client.buttonCooldowns.set(uid, Date.now() + 1000);

    await i.deferUpdate();

    const maxPage = Math.floor(
      (leaderboardData[categories[state.currentCategoryIndex]].users.length -
        1) /
        pageSize,
    );

    switch (i.customId) {
      case ids.wrapLeft:
        state.currentCategoryIndex =
          (state.currentCategoryIndex - 1 + categories.length) %
          categories.length;
        state.currentPage = 0;
        break;

      case ids.wrapRight:
        state.currentCategoryIndex =
          (state.currentCategoryIndex + 1) % categories.length;
        state.currentPage = 0;
        break;

      case ids.userRank: {
        const users =
          leaderboardData[categories[state.currentCategoryIndex]].users;

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
      components: [buildRow()],
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
  const categories = Object.keys(data);
  const categoryData = data[categories[state.currentCategoryIndex]];
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

exports.paginateLeaderboard = async function (
  interaction,
  client,
  title,
  leaderboardData,
  commands,
  userId,
) {
  const categories = Object.keys(leaderboardData);
  const pageSize = 10;

  const state = {
    currentCategoryIndex: 0,
    currentPage: 0,
  };

  const ids = {
    wrapLeft: uuidv4(),
    left: uuidv4(),
    userRank: uuidv4(),
    right: uuidv4(),
    wrapRight: uuidv4(),
  };

  const buildRow = () => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(ids.wrapLeft)
        .setLabel(EMOJIS.REWIND_ARROW)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(ids.left)
        .setLabel(EMOJIS.BACK_ARROW)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(ids.userRank)
        .setLabel(EMOJIS.RECEIVER_BULLSEYE)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(ids.right)
        .setLabel(EMOJIS.FORWARD_ARROW)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(ids.wrapRight)
        .setLabel(EMOJIS.FASTFORWARD_ARROW)
        .setStyle(ButtonStyle.Secondary),
    );
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
    components: [buildRow()],
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
    categories,
    state,
    pageSize,
    buildRow,
    userId,
  );
};
