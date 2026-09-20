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
  COLORS,
  COMMAND_KEYS,
  EMOJIS,
  FILTER_ALL,
  MAXIMUM_SELECT_OPTIONS,
  TRANSACTION_FILTERS,
} = require("./constants.js");
const {
  getDollarsTotal,
  getExplorerTxUrl,
} = require("./currencyUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const { getSortedInventory, formatInventory } = require("./inventoryUtil.js");
const { getSortedWallet, formatWallet } = require("./walletUtil.js");

/** One transaction fills a page; each renders far too much to pack in more. */
const PAGE_SIZE = 1;

/** Transactions of one kind. The ALL sentinel and a blank value match every kind. */
function filterTransactions(transactions, filterValue) {
  const list = Array.isArray(transactions) ? transactions : [];
  if (!filterValue || filterValue === FILTER_ALL) {
    return list;
  }
  return list.filter((transaction) => transaction?.command === filterValue);
}

/**
 * Filter choices for one user's history, each carrying its own count.
 *
 * <p>Only kinds the user actually has are offered. Listing every possible kind
 * would bury the two deposits someone is hunting for among six empty entries,
 * which is the problem the filter exists to solve. `selectedValue` is kept even
 * at a count of zero so an explicitly requested filter still shows as active.
 */
function buildTransactionFilterOptions(transactions, selectedValue) {
  const list = Array.isArray(transactions) ? transactions : [];

  const counts = new Map();
  list.forEach((transaction) => {
    const command = transaction?.command;
    if (command) {
      counts.set(command, (counts.get(command) ?? 0) + 1);
    }
  });

  const known = TRANSACTION_FILTERS.filter((filter) =>
    counts.has(filter.value),
  );

  const unknown = [...counts.keys()]
    .filter(
      (command) => !TRANSACTION_FILTERS.some((f) => f.value === command),
    )
    .sort()
    .map((command) => ({
      value: command,
      label: command.charAt(0).toUpperCase() + command.slice(1),
      emoji: EMOJIS.COMMAND_SATELLITE,
    }));

  const options = [
    {
      value: FILTER_ALL,
      label: "All Transactions",
      emoji: EMOJIS.TRANSACTION_LIST,
      count: list.length,
    },
    ...[...known, ...unknown].map((filter) => ({
      ...filter,
      count: counts.get(filter.value) ?? 0,
    })),
  ];

  const missing =
    selectedValue &&
    selectedValue !== FILTER_ALL &&
    !options.some((option) => option.value === selectedValue);

  if (missing) {
    const preset = TRANSACTION_FILTERS.find((f) => f.value === selectedValue);
    options.push({
      value: selectedValue,
      label: preset?.label ?? selectedValue,
      emoji: preset?.emoji ?? EMOJIS.COMMAND_SATELLITE,
      count: 0,
    });
  }

  return options.slice(0, MAXIMUM_SELECT_OPTIONS);
}

exports.filterTransactions = filterTransactions;
exports.buildTransactionFilterOptions = buildTransactionFilterOptions;

/** Tells the reader which slice they are in and how much of the whole it is. */
function formatTransactionFooter(
  filterOptions,
  filterValue,
  pageIndex,
  totalPages,
  matchCount,
  totalCount,
) {
  const parts = [`Page ${pageIndex + 1} of ${totalPages}`];

  if (filterValue && filterValue !== FILTER_ALL) {
    const active = filterOptions.find(
      (option) => option.value === filterValue,
    );
    parts.unshift(active?.label ?? filterValue);
    parts.push(`${matchCount} of ${totalCount} transactions`);
  } else {
    parts.push(
      `${totalCount} transaction${totalCount === 1 ? "" : "s"}`,
    );
  }

  return parts.join(" • ");
}

exports.formatTransactionFooter = formatTransactionFooter;

exports.paginateTransactions = async function (
  interaction,
  client,
  title,
  transactions,
  commands,
  userId,
  currencies,
  creatures,
  bonuses,
  initialFilter = null,
) {
  const allTransactions = Array.isArray(transactions) ? transactions : [];

  // Numbering follows the whole history, so an entry keeps the number it had
  // in the unfiltered list no matter which filter is applied to reach it.
  const numbersById = new Map(
    allTransactions.map((transaction, index) => [
      transaction?.id,
      allTransactions.length - index,
    ]),
  );

  const state = {
    filter: initialFilter || FILTER_ALL,
    page: 0,
  };

  const filterOptions = buildTransactionFilterOptions(
    allTransactions,
    state.filter,
  );

  const ids = {
    filter: uuidv4(),
    first: uuidv4(),
    prev: uuidv4(),
    next: uuidv4(),
    last: uuidv4(),
  };

  const buildComponents = (totalPages) => {
    const rows = [];

    // One choice is not a filter. The menu only earns its row once there is
    // more than one kind of transaction to switch between.
    if (filterOptions.length > 1) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(ids.filter)
            .setPlaceholder("Filter by transaction type")
            .addOptions(
              filterOptions.map((option) => ({
                label: `${option.label} (${option.count})`,
                value: option.value,
                emoji: option.emoji,
                default: option.value === state.filter,
              })),
            ),
        ),
      );
    }

    const atFirst = state.page <= 0;
    const atLast = state.page >= totalPages - 1;

    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(ids.first)
          .setLabel(EMOJIS.REWIND_ARROW)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(atFirst),
        new ButtonBuilder()
          .setCustomId(ids.prev)
          .setLabel(EMOJIS.BACK_ARROW)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(atFirst),
        new ButtonBuilder()
          .setCustomId(ids.next)
          .setLabel(EMOJIS.FORWARD_ARROW)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(atLast),
        new ButtonBuilder()
          .setCustomId(ids.last)
          .setLabel(EMOJIS.FASTFORWARD_ARROW)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(atLast),
      ),
    );

    return rows;
  };

  const render = () => {
    const matches = filterTransactions(allTransactions, state.filter);
    const totalPages = Math.max(Math.ceil(matches.length / PAGE_SIZE), 1);

    // A filter change can leave the old page past the end of the new list.
    state.page = Math.min(Math.max(state.page, 0), totalPages - 1);

    return {
      embeds: [
        getTransactionEmbed({
          title,
          pageIndex: state.page,
          transactions: matches,
          totalCount: allTransactions.length,
          numbersById,
          filterOptions,
          filterValue: state.filter,
          commands,
          userId,
          currencies,
          creatures,
          bonuses,
        }),
      ],
      components: buildComponents(totalPages),
    };
  };

  const replyEmbed = await interaction.editReply({
    ...render(),
    fetchReply: true,
  });

  const collector = replyEmbed.createMessageComponentCollector({
    filter: (i) =>
      Object.values(ids).includes(i.customId) &&
      i.user.id === interaction.user.id,
    time: BROWSE_WINDOW_MILLISECONDS,
  });

  collector.on("collect", async (i) => {
    const uid = i.user.id;
    const cooldownExpiry = client.buttonCooldowns.get(uid);
    if (cooldownExpiry && Date.now() < cooldownExpiry) return;
    client.buttonCooldowns.set(uid, Date.now() + 1000);

    const matches = filterTransactions(allTransactions, state.filter);
    const maxPage = Math.max(Math.ceil(matches.length / PAGE_SIZE) - 1, 0);

    switch (i.customId) {
      case ids.filter:
        // A different filter makes the old position meaningless, so restart.
        state.filter = i.values?.[0] ?? FILTER_ALL;
        state.page = 0;
        break;
      case ids.first:
        state.page = 0;
        break;
      case ids.prev:
        state.page = Math.max(state.page - 1, 0);
        break;
      case ids.next:
        state.page = Math.min(state.page + 1, maxPage);
        break;
      case ids.last:
        state.page = maxPage;
        break;
    }

    await i.update(render());
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
};

function getTransactionEmbed({
  title,
  pageIndex,
  transactions,
  totalCount,
  numbersById,
  filterOptions,
  filterValue,
  commands,
  userId,
  currencies,
  creatures,
  bonuses,
}) {
  title = title || "Transaction History";
  pageIndex = Number.isInteger(pageIndex) && pageIndex >= 0 ? pageIndex : 0;
  transactions = Array.isArray(transactions) ? transactions : [];
  commands = commands || {};
  userId = userId || null;
  currencies = currencies || {};
  creatures = creatures || {};
  bonuses = bonuses || {};
  filterOptions = Array.isArray(filterOptions) ? filterOptions : [];
  numbersById = numbersById instanceof Map ? numbersById : new Map();

  const matchCount = transactions.length;
  const start = pageIndex * PAGE_SIZE;
  const page = transactions.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(Math.ceil(matchCount / PAGE_SIZE), 1);

  let fields = "";

  const commandMap = getCommandIds(commands);

  page.forEach((t, idx) => {
    t = t || {};

    t.primaryUserId = t.primaryUserId || null;
    const isPrimaryDebit = userId === t.primaryUserId;

    t.primaryReceiverIds = Array.isArray(t.primaryReceiverIds)
      ? t.primaryReceiverIds
      : [];
    const isPrimaryCredit = t.primaryReceiverIds.includes(userId);

    t.secondaryUserId = t.secondaryUserId || null;
    const isSecondaryDebit = userId === t.secondaryUserId;
    t.secondaryReceiverIds = Array.isArray(t.secondaryReceiverIds)
      ? t.secondaryReceiverIds
      : [];
    const isSecondaryCredit = t.secondaryReceiverIds.includes(userId);

    t.input = t.input || "";
    t.blockHash = t.blockHash || "";
    t.guildId = t.guildId || null;
    t.channelId = t.channelId || null;
    t.timestamp = t.timestamp || null;
    t.completedPrimaryTransfers = t.completedPrimaryTransfers || {};
    t.completedPrimaryGuildTransfers = t.completedPrimaryGuildTransfers || {};
    t.completedSecondaryTransfers = t.completedSecondaryTransfers || {};
    t.completedSecondaryGuildTransfers =
      t.completedSecondaryGuildTransfers || {};

    const systemName = `${EMOJIS.SYSTEM_COMPUTER} **SYSTEM**`;

    const commandName = t.command
      ? `\n${EMOJIS.COMMAND_SATELLITE} __Command__\n> </${t.command}:${
          commandMap[t.command]
        }>`
      : "";

    const guildId = t.guildId
      ? `\n${EMOJIS.GUILD_CASTLE} __Guild ID__\n> \`${t.guildId}\``
      : "";

    const channelId =
      t.channelId && t.guildId
        ? `\n${EMOJIS.TELEVISION_MONITOR} __Channel__\n> https://discord.com/channels/${t.guildId}/${t.channelId}`
        : t.channelId
        ? `\n${EMOJIS.TELEVISION_MONITOR} __Channel ID__\n> \`${t.channelId}\``
        : "";

    const commandInput = t.input
      ? `\n${EMOJIS.INPUT_KEYBOARD} __Input__\n> \`${t.input}\``
      : "";

    // The ticker comes from the wallet debits recorded on the transaction, which
    // is what identifies the chain a /send or /receive settled on.
    const debitedTicker = t.blockHash
      ? t.completedPrimaryTransfers?.[
          Object.keys(t.completedPrimaryTransfers)[0]
        ]?.wallets?.[0]?.ticker
      : null;

    const currency = debitedTicker
      ? currencies.find((c) => c.ticker === debitedTicker)
      : null;

    const explorerUrl = getExplorerTxUrl(currency, t.blockHash);

    // Monero has no account explorer and other chains may have none configured,
    // so fall back to the bare hash rather than a dead link.
    const commandAddress = t.blockHash
      ? `\n${EMOJIS.CHAIN_HASH} __Block Hash__\n> ${
          explorerUrl ? `[${t.blockHash}](${explorerUrl})` : `\`${t.blockHash}\``
        }`
      : "";

    const uniqueIdentifier = `${EMOJIS.UNIQUE_ID} __Unique Identifier__\n> \`${t.id}\``;

    const timestampText = `\n${
      EMOJIS.TIMESTAMP_CLOCK
    } __Timestamp__\n> <t:${Math.floor(
      new Date(t.timestamp).getTime() / 1000,
    )}:F>`;

    const primarySender =
      t.primaryUserId === "0" ? systemName : `<@${t.primaryUserId}>`;

    const primaryReceivers = formatReceivers(t.primaryReceiverIds, systemName);

    const aggregatedPrimaryTransfers = aggregateTransfersToSingle(
      isPrimaryDebit,
      t.completedPrimaryTransfers,
    );

    const primaryWalletTransfers = aggregatedPrimaryTransfers["0"].wallets;
    const primaryItemTransfers = aggregatedPrimaryTransfers["0"].items;

    const sortedPrimaryWallets =
      getSortedWallet(primaryWalletTransfers, currencies) || [];
    const sortedPrimaryItems =
      getSortedInventory(
        primaryItemTransfers,
        creatures,
        currencies,
        bonuses,
      ) || [];

    const primaryWalletDisplay = formatWallet(sortedPrimaryWallets);
    const primaryInventoryDisplay = formatInventory(sortedPrimaryItems);

    const primarySenderTitle = `\n${EMOJIS.SENDER_SILHOUETTE} __Sender__\n> ${primarySender}`;
    const primaryReceiverTitle = `\n${EMOJIS.RECEIVER_BULLSEYE} __Receiver(s)__\n> ${primaryReceivers}`;

    const primaryWalletsExist = Array.isArray(primaryWalletDisplay);
    const primaryWalletLines = primaryWalletsExist
      ? primaryWalletDisplay.map((w) => `> ${w.name}\n${w.value}`).join("\n")
      : "> No Currencies";

    const primaryWalletType = isPrimaryCredit
      ? "Credits"
      : isPrimaryDebit
      ? "Debits"
      : "Transfers";

    const primaryCurrencyTransfers = primaryWalletsExist
      ? `\n${EMOJIS.MONEY_BAGS} __**Wallet ${primaryWalletType}**__\n${primaryWalletLines}`
      : ``;

    const primaryItemsExist = Array.isArray(primaryInventoryDisplay);
    const primaryItemLines = primaryItemsExist
      ? primaryInventoryDisplay.map((i) => `> ${i.name}\n${i.value}`).join("\n")
      : "> No Creatures";

    const primaryInventoryType = isPrimaryCredit
      ? "Credits"
      : isPrimaryDebit
      ? "Debits"
      : "Transfers";

    const primaryCreatureTransfers = primaryItemsExist
      ? `\n${EMOJIS.INVENTORY_CABINET} __**Inventory ${primaryInventoryType}**__\n${primaryItemLines}`
      : ``;

    const isSecondaryTransfer =
      Object.keys(t.completedSecondaryTransfers).length !== 0;

    let value =
      `${uniqueIdentifier}${timestampText}${guildId}${channelId}${commandName}${commandInput}${commandAddress}` +
      (isSecondaryTransfer ? `\n### __**Primary Transfer**__` : "") +
      `${primarySenderTitle}${primaryReceiverTitle}` +
      `${primaryCurrencyTransfers}${primaryCreatureTransfers}\n`;

    if (sortedPrimaryWallets.length > 0 && sortedPrimaryItems.length > 0) {
      value += `${
        EMOJIS.TOTAL_CHART
      } __**Estimated Total (USD)**__\n**$${getDollarsTotal(
        sortedPrimaryWallets,
        sortedPrimaryItems,
      )}**`;
    }

    if (isSecondaryTransfer) {
      const secondarySender =
        t.secondaryUserId === "0" ? systemName : `<@${t.secondaryUserId}>`;

      const secondaryReceivers = formatReceivers(t.secondaryReceiverIds, systemName);

      const completedSecondaryTransfers = aggregateTransfersToSingle(
        isSecondaryDebit,
        t.completedSecondaryTransfers,
      );

      const secondaryWalletTransfers = completedSecondaryTransfers["0"].wallets;
      const secondaryItemTransfers = completedSecondaryTransfers["0"].items;

      const sortedSecondaryWallets =
        getSortedWallet(secondaryWalletTransfers, currencies) || [];
      const sortedSecondaryItems =
        getSortedInventory(
          secondaryItemTransfers,
          creatures,
          currencies,
          bonuses,
        ) || [];

      const secondaryWalletDisplay = formatWallet(sortedSecondaryWallets);
      const secondaryInventoryDisplay = formatInventory(sortedSecondaryItems);

      const secondarySenderTitle = `\n${EMOJIS.SENDER_SILHOUETTE} __Sender__\n> ${secondarySender}`;
      const secondaryReceiverTitle = `\n${EMOJIS.RECEIVER_BULLSEYE} __Receiver(s)__\n> ${secondaryReceivers}`;

      const secondaryWalletsExist = Array.isArray(secondaryWalletDisplay);

      const secondaryWalletLines = secondaryWalletsExist
        ? secondaryWalletDisplay
            .map((w) => `> ${w.name}\n${w.value}`)
            .join("\n")
        : "> No Currencies";

      const secondaryWalletType = isSecondaryCredit
        ? "Credits"
        : isSecondaryDebit
        ? "Debits"
        : "Transfers";

      const secondaryCurrencyTransfers = secondaryWalletsExist
        ? `\n${EMOJIS.MONEY_BAGS} __**Wallet ${secondaryWalletType}**__\n${secondaryWalletLines}`
        : ``;

      const secondaryItemsExist = Array.isArray(secondaryInventoryDisplay);

      const secondaryItemLines = secondaryItemsExist
        ? secondaryInventoryDisplay
            .map((i) => `> ${i.name}\n${i.value}`)
            .join("\n")
        : "> No Creatures";

      const secondaryInventoryType = isSecondaryCredit
        ? "Credits"
        : isSecondaryDebit
        ? "Debits"
        : "Transfers";

      const secondaryCreatureTransfers = secondaryItemsExist
        ? `\n${EMOJIS.INVENTORY_CABINET} __**Inventory ${secondaryInventoryType}**__\n${secondaryItemLines}`
        : ``;

      value +=
        `### __Secondary Transfer__\n` +
        `${secondarySenderTitle}${secondaryReceiverTitle}` +
        `${secondaryCurrencyTransfers}${secondaryCreatureTransfers}\n`;

      if (
        sortedSecondaryWallets.length > 0 &&
        sortedSecondaryItems.length > 0
      ) {
        value += `${
          EMOJIS.TOTAL_CHART
        } __**Estimated Total (USD)**__\n> **$${getDollarsTotal(
          sortedSecondaryWallets,
          sortedSecondaryItems,
        )}**`;
      }
    }

    const number =
      (t.id ? numbersById.get(t.id) : null) ?? matchCount - (start + idx);

    fields += `## __User Transaction #${number}__\n` + value;
  });

  if (fields.length === 0) {
    const active = filterOptions.find(
      (option) => option.value === filterValue,
    );
    const label =
      filterValue && filterValue !== FILTER_ALL
        ? active?.label ?? filterValue
        : "Transactions";
    fields += `**No ${label} in the Last 30 Days**`;
  }

  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: title,
    description:
      `### Use </${COMMAND_KEYS.INVENTORY}:${
        commandMap[COMMAND_KEYS.INVENTORY]
      }> and </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> to view your *current* balances!\n` +
      `-# Transaction history is only retained for **30 days**.\n` +
      fields,
    footer: formatTransactionFooter(
      filterOptions,
      filterValue,
      pageIndex,
      totalPages,
      matchCount,
      Number.isInteger(totalCount) ? totalCount : matchCount,
    ),
  });
}

function formatReceivers(receiverIds, systemName, displayLimit = 40) {
  const mentions = receiverIds.map(id => (id === "0" ? systemName : `<@${id}>`));
  const size = mentions.length;
  if (size <= displayLimit) {
    if (size === 1) return mentions[0];
    if (size === 2) return `${mentions[0]} and ${mentions[1]}`;
    const allButLast = mentions.slice(0, size - 1).join(", ");
    const last = mentions[size - 1];
    return `${allButLast}, and ${last}`;
  } else {
    const firstMentions = mentions.slice(0, displayLimit).join(", ");
    const remaining = size - displayLimit;
    return `${firstMentions} and ${remaining} ${remaining === 1 ? "other" : "others"}`;
  }
}

function aggregateTransfersToSingle(isSendingUser, transfers) {
  const walletTotals = {};
  const itemTotals = {};

  for (const entry of Object.values(transfers)) {
    for (const w of entry.wallets) {
      const ticker = w.ticker;
      const raw = BigInt(w.raw);
      if (!walletTotals[ticker]) walletTotals[ticker] = 0n;
      walletTotals[ticker] += raw;
    }

    for (const it of entry.items) {
      const name = it.name;
      if (!itemTotals[name]) itemTotals[name] = 0;
      itemTotals[name] += it.quantity;
    }

    if (!isSendingUser) break;
  }

  return {
    0: {
      pricey: false,
      wallets: Object.entries(walletTotals).map(([ticker, raw]) => ({
        ticker,
        raw: raw.toString(),
        required: false,
      })),
      items: Object.entries(itemTotals).map(([name, quantity]) => ({
        name,
        quantity,
        required: false,
      })),
    },
  };
}
