const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const { getCommandIds } = require("./commandUtil.js");
const { COLORS, COMMAND_KEYS, EMOJIS } = require("./constants.js");
const { getDollarsTotal } = require("./currencyUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const { getSortedInventory, formatInventory } = require("./inventoryUtil.js");
const { getSortedWallet, formatWallet } = require("./walletUtil.js");

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
) {
  let currentPage = 0;
  const pageSize = 1;

  const ids = {
    first: uuidv4(),
    prev: uuidv4(),
    next: uuidv4(),
    last: uuidv4(),
  };

  const buildRow = () => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(ids.first)
        .setLabel(EMOJIS.REWIND_ARROW)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(ids.prev)
        .setLabel(EMOJIS.BACK_ARROW)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(ids.next)
        .setLabel(EMOJIS.FORWARD_ARROW)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(ids.last)
        .setLabel(EMOJIS.FASTFORWARD_ARROW)
        .setStyle(ButtonStyle.Secondary),
    );
  };

  const embed = getTransactionEmbed(
    title,
    currentPage,
    transactions,
    commands,
    userId,
    currencies,
    creatures,
    bonuses,
    pageSize,
  );

  await transactionCollectorCreator(
    client,
    interaction,
    embed,
    ids,
    transactions,
    currentPage,
    pageSize,
    buildRow,
    title,
    commands,
    userId,
    currencies,
    creatures,
    bonuses,
  );
};

async function transactionCollectorCreator(
  client,
  interaction,
  embed,
  allIds,
  transactions,
  currentPage,
  pageSize,
  buildRow,
  title,
  commands,
  userId,
  currencies,
  creatures,
  bonuses,
) {
  const filter = (i) =>
    Object.values(allIds).includes(i.customId) &&
    i.user.id === interaction.user.id;

  const replyEmbed = await interaction.editReply({
    embeds: [embed],
    components: [buildRow()],
    fetchReply: true,
  });

  const collector = replyEmbed.createMessageComponentCollector({
    filter,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    const uid = i.user.id;
    const cooldownExpiry = client.buttonCooldowns.get(uid);
    if (cooldownExpiry && Date.now() < cooldownExpiry) return;
    client.buttonCooldowns.set(uid, Date.now() + 1000);

    const maxPage = Math.max(
      Math.floor((transactions.length - 1) / pageSize),
      0,
    );

    switch (i.customId) {
      case allIds.first:
        currentPage = 0;
        break;
      case allIds.prev:
        currentPage = Math.max(currentPage - 1, 0);
        break;
      case allIds.next:
        currentPage = Math.min(currentPage + 1, maxPage);
        break;
      case allIds.last:
        currentPage = maxPage;
        break;
    }

    const newEmbed = getTransactionEmbed(
      title,
      currentPage,
      transactions,
      commands,
      userId,
      currencies,
      creatures,
      bonuses,
      pageSize,
    );

    await i.update({
      embeds: [newEmbed],
      components: [buildRow()],
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
}

function getTransactionEmbed(
  title,
  pageIndex,
  transactions,
  commands,
  userId,
  currencies,
  creatures,
  bonuses,
  pageSize,
) {
  title = title || "Transaction History";
  pageIndex = Number.isInteger(pageIndex) && pageIndex >= 0 ? pageIndex : 0;
  transactions = Array.isArray(transactions) ? transactions : [];
  commands = commands || {};
  userId = userId || null;
  currencies = currencies || {};
  creatures = creatures || {};
  bonuses = bonuses || {};

  const start = pageIndex * pageSize;
  const page = transactions.slice(start, start + pageSize);
  const totalPages = Math.max(Math.ceil(transactions.length / pageSize), 1);
  const totalTransactions = transactions.length;

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

    const currency = t.blockHash
      ? currencies.find(
          (c) =>
            c.ticker ===
            t.completedPrimaryTransfers[
              Object.keys(t.completedPrimaryTransfers)[0]
            ].wallets[0].ticker,
        )
      : {};

    const commandAddress = t.blockHash
      ? `\n${EMOJIS.CHAIN_HASH} __Block Hash__\n> [${
          t.blockHash
        }](https://nanexplorer.com/${currency.name.toLowerCase()}/blocks/${
          t.blockHash
        })`
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

    fields +=
      `## __User Transaction #${totalTransactions - (start + idx)}__\n` + value;
  });

  if (fields.length === 0) {
    fields += `**No Transactions in the Last 30 Days**`;
  }

  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: title,
    description:
      `### Use </${COMMAND_KEYS.INVENTORY}:${
        commandMap[COMMAND_KEYS.INVENTORY]
      }> and </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> to view your *current* balances!\n` + fields,
    footer: `Page ${pageIndex + 1} of ${totalPages}`,
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
