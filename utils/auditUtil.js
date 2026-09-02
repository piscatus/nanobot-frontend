const { COLORS, COMMAND_DESCRIPTIONS, EMOJIS } = require("./constants.js");
const { buildEmbed } = require("./embedUtil.js");
const {
  formatInventory,
  getSortedInventory,
  getInventorySaleWallet,
} = require("./inventoryUtil.js");
const { formatWallet, getSortedWallet } = require("./walletUtil.js");

const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 30, EXPONENTIAL_AT: 10 });

/**
 * @param {object} data - audit API response
 * @param {boolean} [reveal] - show concealed currencies. Owner only; the caller
 *   is responsible for the permission check.
 */
function formatAudit(data, reveal = false) {
  const {
    bonuses,
    currencies,
    creatures,
    usersItems,
    usersWallets,
    drops,
    guildsWallets,
  } = data;

  // Privacy coins are withheld unless explicitly revealed. Driven by the
  // currency document rather than a ticker check, so any future privacy coin
  // behaves the same way without touching this file.
  const concealedTickers = reveal
    ? null
    : new Set(
        (currencies ?? [])
          .filter((currency) => currency.concealBalances)
          .map((currency) => currency.ticker.toUpperCase()),
      );

  const isConcealed = (ticker) =>
    Boolean(concealedTickers && concealedTickers.has(ticker.toUpperCase()));

  let formatted = "";

  // === Prepare running totals ===
  const totalItemTotals = {};
  const totalWalletTotals = {};

  // === Drops Totals ===
  if (Array.isArray(drops) && drops.length > 0) {
    const dropWalletTotals = {};
    const dropItemTotals = {};

    drops.forEach((drop) => {
      const transfer = drop.transfer;
      const wallets = transfer.wallets;
      const items = transfer.items;

      // Wallet totals from drops
      for (const wallet of wallets) {
        const walletTicker = wallet.ticker;
        const walletRaw = new BigNumber(wallet.raw);
        dropWalletTotals[walletTicker] = (
          dropWalletTotals[walletTicker] || new BigNumber(0)
        ).plus(walletRaw);
        totalWalletTotals[walletTicker] = (
          totalWalletTotals[walletTicker] || new BigNumber(0)
        ).plus(walletRaw);
      }

      // Item totals from drops (integers)
      for (const item of items) {
        const itemName = item.name.toUpperCase();
        const itemQuantity = Number(item.quantity);
        dropItemTotals[itemName] =
          (dropItemTotals[itemName] || 0) + itemQuantity;
        totalItemTotals[itemName] =
          (totalItemTotals[itemName] || 0) + itemQuantity;
      }
    });

    // let formattedWalletString = "";
    // if (Object.keys(dropWalletTotals).length > 0) {
    //   const formattedWalletDrops = formatWallet(
    //     getSortedWallet(
    //       Object.entries(dropWalletTotals).map(([ticker, raw]) => ({
    //         ticker,
    //         raw: raw.toString(),
    //       })),
    //       currencies,
    //     ),
    //   );

    //   for (const item of formattedWalletDrops) {
    //     formattedWalletString += `${item.name}\n${item.value}\n`;
    //   }
    // }

    // let formattedItemString = "";
    // if (Object.keys(dropItemTotals).length > 0) {
    //   const formattedItemDrops = formatInventory(
    //     getSortedInventory(
    //       Object.entries(dropItemTotals).map(([name, quantity]) => ({
    //         name,
    //         quantity,
    //       })),
    //       creatures,
    //       currencies,
    //       bonuses,
    //     ),
    //   );

    //   for (const item of formattedItemDrops) {
    //     formattedItemString += `${item.name}\n${item.value}\n`;
    //   }
    // }

    // let finalDropString = "";
    // if (formattedWalletString) finalDropString += formattedWalletString;
    // if (formattedItemString) {
    //   if (formattedWalletString) finalDropString += "\n";
    //   finalDropString += formattedItemString;
    // }

    // formatted += "## Active Drops\n" + finalDropString;
  }

  // === User Items Totals ===
  if (usersItems) {
    const itemTotals = {};

    usersItems.forEach((entry) => {
      for (const creature of entry.items) {
        const name = creature.name.toUpperCase();
        const quantity = Number(creature.quantity);
        itemTotals[name] = (itemTotals[name] || 0) + quantity;
        totalItemTotals[name] = (totalItemTotals[name] || 0) + quantity;
      }
    });

    // const nonZeroItems = Object.entries(itemTotals).filter(
    //   ([_, qty]) => qty !== 0,
    // );

    // const formattedItems = formatInventory(
    //   getSortedInventory(
    //     nonZeroItems.map(([name, quantity]) => ({ name, quantity })),
    //     creatures,
    //     currencies,
    //     bonuses,
    //   ),
    //   false,
    // );

    // let formattedString = "";
    // if (formattedItems.length > 0) {
    //   for (const item of formattedItems) {
    //     formattedString += `${item.name}\n${item.value}\n`;
    //   }
    // } else {
    //   formattedString += "No User Items\n";
    // }

    // formatted += "## User Items\n" + formattedString;
  }

  // === User Wallets Totals ===
  if (usersWallets) {
    const walletTotals = {};

    usersWallets.forEach((entry) => {
      for (const coin of entry.wallets) {
        const ticker = coin.ticker;
        const raw = new BigNumber(coin.raw);
        walletTotals[ticker] = (walletTotals[ticker] || new BigNumber(0)).plus(
          raw,
        );
        totalWalletTotals[ticker] = (
          totalWalletTotals[ticker] || new BigNumber(0)
        ).plus(raw);
      }
    });

    // const nonZeroWallets = Object.entries(walletTotals).filter(
    //   ([_, total]) => !total.isZero(),
    // );

    // const formattedWallets = formatWallet(
    //   getSortedWallet(
    //     nonZeroWallets.map(([ticker, raw]) => ({
    //       ticker,
    //       raw: raw.toString(),
    //     })),
    //     currencies,
    //   ),
    // );

    // let formattedString = "";
    // if (formattedWallets.length > 0) {
    //   for (const item of formattedWallets) {
    //     formattedString += `${item.name}\n${item.value}\n`;
    //   }
    // } else {
    //   formattedString += "No User Wallets\n";
    // }

    // formatted += "## User Wallets\n" + formattedString;
  }

  // === Server Wallets Totals ===
  if (guildsWallets) {
    const guildTotals = {};

    guildsWallets.forEach((entry) => {
      for (const coin of entry.wallets) {
        const ticker = coin.ticker;
        const raw = new BigNumber(coin.raw);
        guildTotals[ticker] = (guildTotals[ticker] || new BigNumber(0)).plus(
          raw,
        );
        totalWalletTotals[ticker] = (
          totalWalletTotals[ticker] || new BigNumber(0)
        ).plus(raw);
      }
    });

    // const nonZeroGuilds = Object.entries(guildTotals).filter(
    //   ([_, total]) => !total.isZero(),
    // );

    // const formattedWallets = formatWallet(
    //   getSortedWallet(
    //     nonZeroGuilds.map(([ticker, raw]) => ({ ticker, raw: raw.toString() })),
    //     currencies,
    //   ),
    // );

    // let formattedString = "";
    // if (formattedWallets.length > 0) {
    //   for (const item of formattedWallets) {
    //     formattedString += `${item.name}\n${item.value}\n`;
    //   }
    // } else {
    //   formattedString += "No Server Wallets\n";
    // }

    // formatted += "## Server Wallets\n" + formattedString;
  }

  // === TOTAL ITEMS & TOTAL WALLETS (without sale value) ===
  let totalString = "";

  // --- Total Wallets ---
  const nonZeroTotalWallets = Object.entries(totalWalletTotals).filter(
    ([_, total]) => !total.isZero(),
  );

  if (nonZeroTotalWallets.length > 0) {
    const formattedWallets = formatWallet(
      getSortedWallet(
        nonZeroTotalWallets.map(([ticker, raw]) => ({
          ticker,
          raw: raw.toString(),
        })),
        currencies,
      ),
      false,
      concealedTickers,
    );

    if (formattedWallets.length > 0) {
      let walletString = "";
      for (const item of formattedWallets) {
        walletString += `${item.name}\n${item.value}\n`;
      }
      totalString += "## Total Wallets\n" + walletString;
    }
  }

  // --- Total Items ---
  const nonZeroTotalItems = Object.entries(totalItemTotals).filter(
    ([_, qty]) => qty !== 0,
  );

  if (nonZeroTotalItems.length > 0) {
    const formattedItems = formatInventory(
      getSortedInventory(
        nonZeroTotalItems.map(([name, quantity]) => ({ name, quantity })),
        creatures,
        currencies,
        bonuses,
      ),
      false,
    );

    if (formattedItems.length > 0) {
      let itemString = "";
      for (const item of formattedItems) {
        itemString += `${item.name}\n${item.value}\n`;
      }
      totalString += "## Total Items\n" + itemString;
    }
  }

  if (totalString) formatted += totalString;

  // === GRAND TOTALS (wallets + sale value) ===
  const grandWalletMap = {};

  // Add all total wallets
  for (const [ticker, raw] of nonZeroTotalWallets) {
    grandWalletMap[ticker] = new BigNumber(raw);
  }

  // Add sale value wallets from all items
  if (nonZeroTotalItems.length > 0) {
    const saleWallets = getInventorySaleWallet(
      nonZeroTotalItems.map(([name, quantity]) => ({ name, quantity })),
      creatures,
      currencies,
      bonuses,
    );

    for (const walletEntry of saleWallets) {
      const ticker = walletEntry.ticker;
      const raw = new BigNumber(walletEntry.raw);
      grandWalletMap[ticker] = (
        grandWalletMap[ticker] || new BigNumber(0)
      ).plus(raw);
    }
  }

  // Convert to array and format
  const consolidatedGrandWallets = Object.entries(grandWalletMap).map(
    ([ticker, raw]) => ({ ticker, raw: raw.toString() }),
  );

  if (consolidatedGrandWallets.length > 0) {
    const formattedWallets = formatWallet(
      getSortedWallet(consolidatedGrandWallets, currencies),
      false,
      concealedTickers,
    );
    const walletItems = Array.isArray(formattedWallets)
      ? formattedWallets
      : [formattedWallets];

    let walletString = "";
    for (const item of walletItems) {
      walletString += `${item.name}\n${item.value}\n`;
    }
    formatted += "## Grand Totals\n" + walletString;
  }

  // === HOT WALLETS ===
  const hotTotals = {};

  currencies.forEach((currency) => {
    const ticker = currency.ticker.toUpperCase();
    // Treat a missing liquidity value as zero rather than skipping the
    // currency, so a coin the bot holds none of still shows up and still counts
    // against the liquidity check.
    const raw = new BigNumber(currency.liquidity ?? "0");
    hotTotals[ticker] = raw.isNaN() ? new BigNumber(0) : raw;
  });

  let isLiquid = true;

  for (const [symbol, grandValue] of Object.entries(grandWalletMap)) {
    // A concealed currency is excluded from the public solvency check on
    // purpose: a liquid/illiquid verdict that depended on it would leak whether
    // reserves cover liabilities, which is information about the balance.
    if (isConcealed(symbol)) {
      continue;
    }

    const hotValue = hotTotals[symbol];

    if (!hotValue) {
      isLiquid = false;
      break;
    }

    if (grandValue.isGreaterThan(hotValue)) {
      isLiquid = false;
      break;
    }
  }

  // Every enabled currency is listed, including empty ones. An audit that
  // silently omits a currency holding nothing cannot be used to confirm the
  // currency is actually being tracked.
  const hotWalletEntries = Object.entries(hotTotals).map(([ticker, raw]) => ({
    ticker,
    raw: raw.toString(),
  }));

  if (hotWalletEntries.length > 0) {
    const formattedWallets = formatWallet(
      getSortedWallet(hotWalletEntries, currencies),
      true,
      concealedTickers,
    );

    const walletItems = Array.isArray(formattedWallets)
      ? formattedWallets
      : [formattedWallets];

    if (walletItems.length > 0) {
      let walletString = "";
      for (const item of walletItems) {
        walletString += `${item.name}\n${item.value}\n`;
      }
      formatted += "## Hot Wallets\n" + walletString;
    }
  }

  const concealedCount = concealedTickers ? concealedTickers.size : 0;

  const liquidityStatus =
    (isLiquid ? "## The Bot is Liquid ✅" : "## The Bot is Illiquid ❌") +
    (concealedCount > 0
      ? "\n-# Private currencies are withheld from this report and excluded " +
        "from the liquidity check. Run this command with the reveal option as " +
        "the bot owner for the full figures."
      : "");

  return buildEmbed({
    color: isLiquid ? COLORS.LIQUID_GREEN : COLORS.ERROR_RED,
    title:
      `${EMOJIS.AUDIT_NOTES} ${COMMAND_DESCRIPTIONS.AUDIT}` +
      (reveal ? " (Full)" : ""),
    description: formatted + liquidityStatus,
  });
}

module.exports = {
  formatAudit,
};
