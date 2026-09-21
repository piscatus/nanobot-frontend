const { confirm } = require("./buttonUtil.js");
const { send, sendEmbed } = require("./channelUtil.js");
const { COMMAND_KEYS, STATUS_CODES } = require("./constants.js");
const { catchMessageException } = require("./errorUtil.js");
const { checkStatuses } = require("./statusUtil.js");
const { formatUserMentions, isValidString } = require("./stringUtil.js");
const {
  getBonusMultiplier,
  getDecimalCreatureValue,
} = require("./creatureUtil.js");
const {
  getDollarsTotal,
  getCurrencyDollarValue,
  getCurrencyDecimalValue,
  formatConfirmationRequirement,
  formatNetworkNotice,
  formatQuotedNetworkNotice,
} = require("./currencyUtil.js");
const { getCommandIds } = require("./commandUtil.js");
const { COLORS, EMOJIS } = require("./constants.js");
const { buildEmbed } = require("./embedUtil.js");
const { getSortedInventory } = require("./inventoryUtil.js");
const { formatTime } = require("./timeUtil.js");
const { getSortedWallet } = require("./walletUtil.js");
const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 30 });
const dollarValueDecimals = 8;

function capitalize(value) {
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function buildCriteriaList(drop, displayTimestamp) {
  const criteriaList = [];

  if (drop != null) {
    const hasEndTime = isValidString(drop.endTime);

    // Trivia drops: before confirmation these are what the user asked for
    // (absent when they left the option empty); on the receipt they are the
    // chosen question's. Never anything that could hint at the answer.
    if (drop.trivia && isValidString(drop.trivia.category)) {
      criteriaList.push({
        name: EMOJIS.TRIVIA_BRAIN + " Category",
        value: `> **${drop.trivia.category}**`,
        inline: true,
      });
    }
    if (drop.trivia && isValidString(drop.trivia.difficulty)) {
      criteriaList.push({
        name: EMOJIS.LEVEL_CHARTS + " Difficulty",
        value: `> **${capitalize(drop.trivia.difficulty)}**`,
        inline: true,
      });
    }

    if (isValidString(drop.duration)) {
      criteriaList.push({
        name: hasEndTime
          ? EMOJIS.TIMESTAMP_HOURGLASS + " Drop Duration"
          : EMOJIS.TIMESTAMP_HOURGLASS + " Activity Duration",
        value: `> **${formatTime(drop.duration, drop.seconds)}**`,
        inline: true,
      });
    }

    if (displayTimestamp) {
      const unixTimestamp = Math.floor(new Date(drop.endTime).getTime() / 1000);
      criteriaList.push({
        name: EMOJIS.TIMESTAMP_CLOCK + " Drop Ends",
        value: `> <t:${unixTimestamp}:R>`,
      });
    }

    if (isValidString(drop.maximumEntries) && drop.maximumEntries.length < 4) {
      // On a trivia drop the same field caps winners, not joiners.
      criteriaList.push({
        name: drop.trivia
          ? EMOJIS.AWARD_TROPHY + " Maximum Winners"
          : hasEndTime
          ? EMOJIS.LEVEL_CHARTS + " Maximum Entries"
          : EMOJIS.MAN_RUNNING + " Most Recently Active Users",
        value: `> **${drop.maximumEntries}**`,
        inline: true,
      });
    }

    if (isValidString(drop.numberWinners) && drop.numberWinners !== 0) {
      criteriaList.push({
        name: EMOJIS.RANDOM_DICE + " Random Winners",
        value: `> **${drop.numberWinners}**`,
        inline: true,
      });
    }

    if (isValidString(drop.requiredRole)) {
      criteriaList.push({
        name: EMOJIS.ROLES_MASKS + " Required Role",
        value: `> <@&${drop.requiredRole}>`,
        inline: true,
      });
    }
  }

  return criteriaList;
}

/**
 * Builds a confirmation or receipt embed for transfer commands.
 * @param {object} opts - Options object
 * @param {string} opts.userId - User ID for mention
 * @param {string|null} opts.input - User input string
 * @param {string} opts.command - Command key
 * @param {string|null} opts.address - Withdrawal/representative address
 * @param {boolean} opts.isComplete - Whether transfer is complete
 * @param {object|string|null} opts.optional - Optional section { emoji, title, description }
 * @param {Array} opts.items - Inventory items
 * @param {Array} opts.wallets - Wallet entries
 * @param {Array|null} opts.creatures - Creatures list
 * @param {Array} opts.commands - Commands list
 * @param {Array|null} opts.bonuses - Bonuses list
 * @param {Array} opts.currencies - Currencies list
 * @param {object|null} opts.drop - Drop config
 * @param {boolean} opts.displayTimestamp - Show drop end timestamp
 * @param {string} opts.title - Embed title
 * @param {string|null} opts.url - Embed URL
 * @param {boolean} opts.includeNotes - Include usage notes
 * @param {string|null} opts.transactionId - Transaction ID for footer
 * @param {string|null} [opts.networkFee] - Exact fee quoted for this withdrawal
 */
function getConfirmationInfo(opts) {
  const {
    userId,
    input,
    command,
    address,
    isComplete,
    optional,
    items,
    wallets,
    creatures,
    commands,
    bonuses,
    currencies,
    drop,
    displayTimestamp,
    title,
    url,
    includeNotes,
    transactionId,
    networkFee,
  } = opts;
  let output = "";

  if (isComplete) {
    output += `<@${userId}>'s ${command} request *successfully* completed!\n`;
  } else {
    output += `Please confirm your ${command} request —\n`;
  }

  if (includeNotes) {
    const commandMap = getCommandIds(commands);
    if (command === COMMAND_KEYS.SELL || command === COMMAND_KEYS.SALE) {
      output += `\n-# Bulk sale bonus multipliers (up to 2x) are available and outlined in the </${
        COMMAND_KEYS.BONUSES
      }:${commandMap[COMMAND_KEYS.BONUSES]}> guide.\n`;
    }

    if (wallets.length !== 0 && items.length !== 0) {
      output += `\n-# Use </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> and </${COMMAND_KEYS.INVENTORY}:${
        commandMap[COMMAND_KEYS.INVENTORY]
      }> to view your *updated* currency and creature balances.\n`;
    } else if (items.length !== 0) {
      output +=
        `\n-# Use </${COMMAND_KEYS.INVENTORY}:${
          commandMap[COMMAND_KEYS.INVENTORY]
        }> to view your *updated* creature balances.\n` +
        `\n-# Use </${COMMAND_KEYS.SELL}:${
          commandMap[COMMAND_KEYS.SELL]
        }> to exchange your creatures for currencies.\n`;
    } else {
      output += `\n-# Use </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> to view your *updated* currency balances.\n`;
    }

    output += `\n-# Use </transactions:${
      commandMap[COMMAND_KEYS.TRANSACTIONS]
    }> to view your transaction history.\n`;
  }

  if (input !== null && input !== "") {
    output += `### ${EMOJIS.INPUT_KEYBOARD} __Input__\n> \`${input}\`\n`;
  }

  if (optional !== null && optional !== "") {
    output += `### ${optional.emoji} __${optional.title}__\n> ${optional.description}\n`;
  }

  const currencyMap = new Map(currencies.map((c) => [c.ticker, c]));

  const hasValidItems =
    items.length > 1 || (items.length === 1 && items[0].quantity !== 0);

  const totalTransfers = items.length + wallets.length;

  if (hasValidItems) {
    const verbiage =
      command === COMMAND_KEYS.MERGE || command === COMMAND_KEYS.FISH
        ? "Credits"
        : "Debits";
    output += `### ${EMOJIS.INVENTORY_CABINET} __Inventory ${verbiage}__\n`;

    const creatureMap = new Map(
      creatures.map((c) => [c.name.toUpperCase(), c]),
    );

    for (const item of items) {
      const creature = creatureMap.get(item.name.toUpperCase());
      if (!creature) continue;

      const currency = currencyMap.get(creature.ticker);
      if (!currency) continue;

      const creatureValue = getDecimalCreatureValue(
        creature.value,
        currency.precision,
        item.quantity,
        bonuses,
      );

      const creatureDollarValue = getCurrencyDollarValue(
        creatureValue,
        currency.value,
        dollarValueDecimals,
      );

      const label =
        item.quantity === 1 ? creature.name : creature.pluralization;

      let bonusSuffix = "";
      if (
        (command === COMMAND_KEYS.SELL || command === COMMAND_KEYS.SALE) &&
        bonuses
      ) {
        const multiplier = getBonusMultiplier(item.quantity, bonuses);
        bonusSuffix = ` (${new BigNumber(multiplier).toFixed(2)}x)`;
      }

      output += `> **${item.quantity} ${label}** (=${creatureValue} ${creature.ticker}) (≈$${creatureDollarValue}) ${creature.emoji}${bonusSuffix}\n`;
    }
  }

  const hasValidWallets =
    wallets.length > 1 || (wallets.length === 1 && wallets[0].raw !== "0");

  if (hasValidWallets) {
    const verbiage =
      command === COMMAND_KEYS.SELL ||
      command === COMMAND_KEYS.SALE ||
      command === COMMAND_KEYS.MERGE
        ? "Credits"
        : "Debits";

    output += `### ${EMOJIS.MONEY_BAGS} __Wallet ${verbiage}__\n`;

    for (const wallet of wallets) {
      const currency = currencyMap.get(wallet.ticker);
      if (!currency) continue;

      const decimalValue = getCurrencyDecimalValue(
        wallet.raw,
        currency.precision,
      );

      const decimalDollarValue = getCurrencyDollarValue(
        decimalValue,
        currency.value,
        dollarValueDecimals,
      );

      output += `> **${decimalValue} ${wallet.ticker}** (≈$${decimalDollarValue}) ${currency.emoji}\n`;
    }
  }

  if ((hasValidItems || hasValidWallets) && totalTransfers > 1) {
    output += `### ${
      EMOJIS.TOTAL_CHART
    } __Estimated Total (USD)__\n> **$${getDollarsTotal(
      getSortedWallet(wallets, currencies),
      command === COMMAND_KEYS.SELL || command === COMMAND_KEYS.SALE
        ? null
        : getSortedInventory(items, creatures, currencies, bonuses),
    )}**\n`;
  }

  if (command === COMMAND_KEYS.SEND || command === COMMAND_KEYS.WITHDRAW) {
    output += `### ${EMOJIS.ADDRESS_PIN} __Withdrawal Address__\n> \`${address}\`\n`;

    // Fee and settlement disclosure before confirming: on a chain with fees the
    // recipient gets less than the requested amount, and settlement time varies
    // by network. Driven by the currency document, so feeless chains get the
    // reassuring version and a new currency needs no change here.
    const withdrawalCurrency =
      wallets.length === 1 ? currencyMap.get(wallets[0].ticker) : null;
    if (withdrawalCurrency) {
      const quoted =
        networkFee &&
        wallets.length === 1 &&
        new BigNumber(networkFee).isGreaterThan(0);
      output +=
        (quoted
          ? formatQuotedNetworkNotice(
              withdrawalCurrency,
              networkFee,
              wallets[0].raw,
            )
          : formatNetworkNotice(withdrawalCurrency)) + "\n";
    }
  }

  if (command === COMMAND_KEYS.UPDATE) {
    output += `### ${EMOJIS.ADDRESS_PIN} __Representative Address__\n> \`${address}\`\n`;
    const updateCurrency =
      wallets.length === 1 ? currencyMap.get(wallets[0].ticker) : null;
    const confirmations = formatConfirmationRequirement(updateCurrency);
    // Representative changes are on-chain but not a transfer, so the fee notice
    // would be misleading. Settlement time still belongs here.
    if (confirmations) {
      output += `**Settles after ${confirmations}.**\n`;
    }
  }

  let customColor = COLORS.NANOBOT_BLUE;
  if (wallets.length == 1 && items.length == 0) {
    const currency = currencyMap.get(wallets[0].ticker);
    customColor = currency.color;
  }

  return buildEmbed({
    color: customColor,
    title: title,
    description: output,
    url: url,
    fields: buildCriteriaList(drop, displayTimestamp),
    footer:
      transactionId !== null ? `Nanobot Transaction ID ${transactionId}` : null,
  });
}

function getTransferInfo(
  userId,
  command,
  completedTransfers,
  aliases,
  bonuses,
  commands,
  currencies,
  creatures,
  eachFlag,
  username = null,
) {
  try {
    let isWalletTransfer = false;
    let isInventoryTransfer = false;
    let isBotTransfer = false;
    let transferEmojis = "";
    const commandMap = getCommandIds(commands);
    // Mention plus plain username when supplied: an uncached member renders as a
    // raw id, leaving other readers unable to tell who ran the command.
    const executor = username ? `<@${userId}> (${username})` : `<@${userId}>`;
    const transferMessage = `${executor} used </${command}:${commandMap[command]}>`;
    let transferDollarValue = "(≈$";
    let transferValue = "**";
    let totalValue = new BigNumber("0");
    let transferUser = formatUserMentions(Object.keys(completedTransfers));

    for (const userId in completedTransfers) {
      if (Object.hasOwnProperty.call(completedTransfers, userId)) {
        if (userId === process.env.BOT_USER_ID) {
          isBotTransfer = true;
        }
        const userData = completedTransfers[userId];

        let transferCount = 0;

        if (userData.wallets.length > 0) {
          isWalletTransfer = true;
        }
        userData.wallets.forEach((wallet) => {
          const { ticker, raw } = wallet;
          for (let c = 0; c < currencies.length; c++) {
            if (currencies[c].ticker === ticker) {
              if (transferCount > 0) {
                transferValue += " + ";
              }
              transferEmojis += `${currencies[c].emoji} `;
              transferCount = transferCount + 1;
              let bigRaw = new BigNumber(raw);
              bigRaw = bigRaw.dividedBy(
                `1e+${new BigNumber(currencies[c].precision).toNumber()}`,
              );
              transferValue += `${bigRaw.toFixed()} ${ticker}`;
              totalValue = totalValue.plus(
                bigRaw.multipliedBy(currencies[c].value),
              );
            }
          }
        });

        if (userData.items.length > 0) {
          isInventoryTransfer = true;
        }
        userData.items.forEach((item) => {
          const { name, quantity } = item;
          for (let c = 0; c < creatures.length; c++) {
            if (creatures[c].name.toUpperCase() === name) {
              if (transferCount > 0) {
                transferValue += " + ";
              }
              transferEmojis += `${creatures[c].emoji} `;
              transferCount = transferCount + 1;
              transferValue += `${quantity} ${name}`;
              for (let d = 0; d < currencies.length; d++) {
                if (creatures[c].ticker === currencies[d].ticker) {
                  let bigValue = new BigNumber(creatures[c].value);
                  totalValue = totalValue.plus(
                    bigValue
                      .dividedBy(Math.pow(10, currencies[d].precision))
                      .multipliedBy(currencies[d].value),
                  );
                }
              }
            }
          }
        });

        transferDollarValue +=
          getDollarsTotal(
            getSortedWallet(userData.wallets, currencies),
            getSortedInventory(userData.items, creatures, currencies, bonuses),
          ) + ")";
        if (eachFlag && Object.keys(completedTransfers).length > 1) {
          transferDollarValue += " **EACH**";
        }
        transferValue += "**";
      }
      break;
    }

    if (aliases?.length > 0) {
      aliases.forEach((alias) => {
        transferEmojis += `${alias.emoji} `;
      });
    }

    const defaultMessage =
      isWalletTransfer && isInventoryTransfer
        ? `-# Use </${COMMAND_KEYS.WALLET}:${
            commandMap[COMMAND_KEYS.WALLET]
          }> and </${COMMAND_KEYS.INVENTORY}:${
            commandMap[COMMAND_KEYS.INVENTORY]
          }> to view your *updated* currency and creature balances.`
        : isWalletTransfer && !isInventoryTransfer
        ? `-# Use </${COMMAND_KEYS.WALLET}:${
            commandMap[COMMAND_KEYS.WALLET]
          }> to view your *updated* currency balances.`
        : !isWalletTransfer && isInventoryTransfer
        ? `-# Use </${COMMAND_KEYS.INVENTORY}:${
            commandMap[COMMAND_KEYS.INVENTORY]
          }> to view your *updated* creature balances.`
        : "";

    const transferNote = isBotTransfer
      ? `-# You have contributed to this server's fishing </${
          COMMAND_KEYS.RESERVES
        }:${commandMap[COMMAND_KEYS.RESERVES]}>!`
      : defaultMessage;

    return {
      transferDollarValue: transferDollarValue,
      transferEmojis: transferEmojis,
      transferMessage: transferMessage,
      transferNote: transferNote,
      transferUser: transferUser,
      transferValue: transferValue,
    };
  } catch (err) {
    console.error(
      command.toUpperCase() + " transferUtil.js transferInfo Error:",
      err,
    );
  }
}

/**
 * Executes a transfer API call with optional confirmation flow.
 * Returns the final response or null if early exit (status failure or user cancelled).
 *
 * @param {object} interaction - Discord interaction
 * @param {object} options - Execution options
 * @param {function} options.apiCall - async (confirmed) => response
 * @param {string} options.statusCommandKey - Command key for status checks
 * @param {string} options.confirmCommandKey - Command key for confirm dialog (may differ, e.g. SALE for sell)
 * @param {function} options.getConfirmationParams - (response) => embed for confirm dialog
 */
async function executeTransferWithConfirmation(interaction, options) {
  const {
    apiCall,
    statusCommandKey,
    confirmCommandKey,
    getConfirmationParams,
  } = options;

  let response = await apiCall(false);

  if (
    !(await checkStatuses(
      interaction,
      response,
      STATUS_CODES.OK,
      statusCommandKey,
    ))
  )
    return null;

  if (response.data.confirmation) {
    const confirmed = await confirm(
      interaction,
      confirmCommandKey,
      getConfirmationParams(response),
    );
    if (!confirmed) return null;
    response = await apiCall(true);
  }

  if (
    !(await checkStatuses(
      interaction,
      response,
      STATUS_CODES.OK,
      statusCommandKey,
    ))
  )
    return null;

  return response;
}

/**
 * Totals every recipient's completed transfer into one wallet and item list.
 *
 * <p>The executor is debited the sum of what all recipients received, so the sum
 * is what "Wallet Debits" must show. Reading a single recipient's entry happens
 * to be right for a one-recipient gift, but for a rain across N users it
 * understates the debit by a factor of N.
 *
 * @param {object} completedTransfers - keyed by recipient user id
 * @returns {{ wallets: Array, items: Array }}
 */
function sumCompletedTransfers(completedTransfers) {
  const walletTotals = new Map();
  const itemTotals = new Map();

  for (const transfer of Object.values(completedTransfers ?? {})) {
    for (const wallet of transfer?.wallets ?? []) {
      const previous = walletTotals.get(wallet.ticker) ?? new BigNumber(0);
      walletTotals.set(
        wallet.ticker,
        previous.plus(new BigNumber(wallet.raw ?? "0")),
      );
    }
    for (const item of transfer?.items ?? []) {
      const previous = itemTotals.get(item.name) ?? 0;
      itemTotals.set(item.name, previous + (item.quantity ?? 0));
    }
  }

  return {
    wallets: [...walletTotals.entries()].map(([ticker, raw]) => ({
      ticker,
      raw: raw.toFixed(0),
    })),
    items: [...itemTotals.entries()].map(([name, quantity]) => ({
      name,
      quantity,
    })),
  };
}

/**
 * Posts transfer message to channel, sends receipt to user, and logs to system/guild channels.
 * Used by gift, award, rain commands.
 *
 * @param {object} interaction - Discord interaction
 * @param {object} client - Discord client
 * @param {object} options - Post-transfer options
 */
async function postTransferMessageAndLog(interaction, client, options) {
  const {
    commandKey,
    emoji,
    response,
    input,
    getRecipientInfo,
    drop,
    getTransferUserSuffix,
    eachFlag,
  } = options;

  const {
    aliases,
    completedPrimaryTransfers,
    guildConfigurations,
    transactionId,
  } = response.data;

  const transferInfo = getTransferInfo(
    interaction.user.id,
    commandKey,
    completedPrimaryTransfers,
    aliases,
    response.data.bonuses,
    response.data.commands,
    response.data.currencies,
    response.data.creatures,
    eachFlag,
  );

  const transferUserSuffix = getTransferUserSuffix(transferInfo);
  const recipientInfo = getRecipientInfo(transferInfo);

  const finalMessage =
    `${transferInfo.transferMessage} ` +
    `${emoji} ` +
    `to transfer ` +
    `**${input}** ` +
    `${transferUserSuffix}` +
    `\n` +
    `${transferInfo.transferEmojis}` +
    `${transferInfo.transferValue} ` +
    `${transferInfo.transferDollarValue} `;

  const message = await send(
    client,
    commandKey,
    interaction.channel.id,
    finalMessage + `\n` + `${transferInfo.transferNote}`,
  );

  // Totalled across recipients, not read from the first one: the executor was
  // debited the sum, which is what the receipt and log need to report.
  const completedTransfer = sumCompletedTransfers(completedPrimaryTransfers);
  const receiptEmbed = getConfirmationInfo({
    userId: interaction.user.id,
    input,
    command: commandKey,
    address: null,
    isComplete: true,
    optional: recipientInfo,
    items: completedTransfer.items,
    wallets: completedTransfer.wallets,
    creatures: response.data.creatures,
    commands: response.data.commands,
    bonuses: response.data.bonuses,
    currencies: response.data.currencies,
    drop,
    displayTimestamp: false,
    title: options.embedTitle,
    url: null,
    includeNotes: true,
    transactionId,
  });

  const guildId = interaction.guildId ?? null;
  const channelId = interaction.channelId ?? null;
  const messageLink =
    message !== undefined && isValidString(message.id)
      ? `https://discord.com/channels/${guildId}/${channelId}/${message.id}`
      : null;

  if (messageLink) {
    await interaction.editReply({
      embeds: [receiptEmbed],
      components: [],
    });
  } else {
    await catchMessageException(interaction, commandKey);
  }

  const logEmbed = getConfirmationInfo({
    userId: interaction.user.id,
    input,
    command: commandKey,
    address: null,
    isComplete: true,
    optional: recipientInfo,
    items: completedTransfer.items,
    wallets: completedTransfer.wallets,
    creatures: response.data.creatures,
    commands: response.data.commands,
    bonuses: response.data.bonuses,
    currencies: response.data.currencies,
    drop,
    displayTimestamp: false,
    title: options.embedTitle,
    url: messageLink,
    includeNotes: false,
    transactionId,
  });

  const systemLoggingChannelId =
    process.env.TRANSFER_LOGGING_CHANNEL_ID ?? null;
  if (isValidString(systemLoggingChannelId)) {
    try {
      await sendEmbed(
        client,
        commandKey,
        systemLoggingChannelId,
        logEmbed,
        [],
      );
    } catch (e) {
      console.log(finalMessage);
      console.error(e);
    }
  }

  const guildLoggingChannelId =
    guildConfigurations?.transferLoggingChannelId ?? null;
  if (isValidString(guildLoggingChannelId)) {
    await sendEmbed(
      client,
      commandKey,
      guildLoggingChannelId,
      logEmbed,
      [],
    );
  }
}

/**
 * Builds receipt and log embeds that differ only by includeNotes.
 * Receipt shows notes to user; log omits them.
 *
 * @param {object} params - Same params as getConfirmationInfo except includeNotes
 * @param {boolean} useNotesOnReceipt - Whether receipt includes notes (default true)
 * @returns {{ receiptEmbed: object, logEmbed: object }}
 */
function buildReceiptAndLogEmbeds(params, useNotesOnReceipt = true) {
  return {
    receiptEmbed: getConfirmationInfo({
      ...params,
      includeNotes: useNotesOnReceipt,
    }),
    logEmbed: getConfirmationInfo({
      ...params,
      includeNotes: false,
    }),
  };
}

/**
 * Posts receipt only (no channel message) and logs. Used by merge, sell, send, update.
 *
 * @param {object} interaction - Discord interaction
 * @param {object} client - Discord client
 * @param {object} options - Receipt options
 */
async function postTransferReceiptAndLog(interaction, client, options) {
  const {
    commandKey,
    receiptEmbed,
    logEmbed,
    loggingChannelId,
    ephemeral = false,
  } = options;

  await interaction.editReply({
    embeds: [receiptEmbed],
    components: [],
    ephemeral,
  });

  if (isValidString(loggingChannelId)) {
    try {
      await sendEmbed(client, commandKey, loggingChannelId, logEmbed, []);
    } catch (e) {
      console.error(`${commandKey} sendEmbed`, e);
    }
  }
}

module.exports = {
  buildCriteriaList,
  buildReceiptAndLogEmbeds,
  executeTransferWithConfirmation,
  getConfirmationInfo,
  getTransferInfo,
  sumCompletedTransfers,
  postTransferMessageAndLog,
  postTransferReceiptAndLog,
};
