const { COLORS, COMMAND_DESCRIPTIONS, EMOJIS } = require("./constants.js");
const {
  getCurrencyDecimalValue,
  getCurrencyDollarValue,
} = require("./currencyUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const {
  formatInventory,
  getInventorySaleWallet,
  getSortedInventory,
} = require("./inventoryUtil.js");
const { CONCEALED_PLACEHOLDER } = require("./walletUtil.js");

const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 30, EXPONENTIAL_AT: 10 });

const dollarValueDecimals = 8;

/** Stands in for a verdict on a currency excluded from the public check. */
const CONCEALED_MARKER = "🔒";

/**
 * A raw amount as a BigNumber, treating an absent or unparseable value as zero
 * rather than poisoning every total it is added into with NaN.
 */
function toRaw(value) {
  const raw = new BigNumber(value ?? "0");
  return raw.isNaN() ? new BigNumber(0) : raw;
}

/**
 * A raw amount as a decimal string in the currency's own precision.
 *
 * <p>Fixed rather than stringified because a raw balance runs to tens of
 * digits, and this module configures BigNumber to switch to exponential
 * notation well below that.
 */
function getDecimalValue(raw, currency) {
  return getCurrencyDecimalValue(
    toRaw(raw).toFixed(0),
    Number(currency.precision),
  );
}

/**
 * A raw amount rendered as "**1.23 XNO** ≈ $4.56", or as placeholders when the
 * currency is concealed. The dollar value is withheld alongside the amount,
 * since dividing it by the published exchange rate recovers the amount.
 */
function formatAmount(raw, currency, concealed) {
  if (concealed) {
    return `**${CONCEALED_PLACEHOLDER} ${currency.ticker}** ≈ $${CONCEALED_PLACEHOLDER}`;
  }

  const value = getDecimalValue(raw, currency);

  return `**${value} ${currency.ticker}** ≈ $${getCurrencyDollarValue(
    value,
    currency.value,
    dollarValueDecimals,
  )}`;
}

/** One figure's dollar value summed across several currencies. */
function sumDollars(entries, pick) {
  const total = entries.reduce(
    (running, entry) =>
      running.plus(
        getCurrencyDollarValue(
          getDecimalValue(pick(entry), entry.currency),
          entry.currency.value,
          dollarValueDecimals,
        ),
      ),
    new BigNumber(0),
  );

  return getCurrencyDollarValue(total, 1, dollarValueDecimals);
}

/**
 * Wallet balances and creature counts across every source the audit covers:
 * active drops, user inventories, user wallets, and server wallets.
 *
 * <p>Wallet totals are keyed by upper case ticker so a ticker differing only in
 * case cannot split into two rows that each look solvent on their own.
 */
function computeAuditTotals(data) {
  const walletTotals = {};
  const itemTotals = {};

  const addWallets = (wallets) => {
    for (const wallet of wallets ?? []) {
      const ticker = wallet.ticker.toUpperCase();
      walletTotals[ticker] = (walletTotals[ticker] ?? new BigNumber(0)).plus(
        toRaw(wallet.raw),
      );
    }
  };

  const addItems = (items) => {
    for (const item of items ?? []) {
      const name = item.name.toUpperCase();
      itemTotals[name] = (itemTotals[name] ?? 0) + Number(item.quantity);
    }
  };

  for (const drop of data.drops ?? []) {
    addWallets(drop.transfer?.wallets);
    addItems(drop.transfer?.items);
  }

  for (const entry of data.usersItems ?? []) {
    addItems(entry.items);
  }

  for (const entry of data.usersWallets ?? []) {
    addWallets(entry.wallets);
  }

  for (const entry of data.guildsWallets ?? []) {
    addWallets(entry.wallets);
  }

  return { walletTotals, itemTotals };
}

/**
 * Per-currency solvency position: everything credited to users and servers -
 * wallet balances plus the sale value of every creature held - against the
 * reserve the bot keeps in its hot wallet.
 *
 * <p>Tickers carrying a balance that no currency document describes are
 * returned separately as `untracked`. They cannot be priced or backed, so they
 * fail the liquidity check, and listing them is the only way that verdict is
 * explicable: an unresolvable ticker is dropped from every formatted row, so
 * the report would otherwise read as illiquid for no visible reason.
 *
 * @param {object} data - audit API response
 * @param {boolean} [reveal] - include concealed currencies at their real
 *   figures and in the liquidity verdict
 */
function getAuditLedger(data, reveal = false) {
  const { bonuses, creatures, currencies } = data;
  const { walletTotals, itemTotals } = computeAuditTotals(data);

  const heldItems = Object.entries(itemTotals)
    .filter(([, quantity]) => quantity !== 0)
    .map(([name, quantity]) => ({ name, quantity }));

  // A creature is credited in the currency it sells for, so its sale value is
  // folded into the same figure as wallet balances.
  const saleTotals = {};
  for (const sale of getInventorySaleWallet(
    heldItems,
    creatures ?? [],
    currencies ?? [],
    bonuses ?? [],
  )) {
    const ticker = sale.ticker.toUpperCase();
    saleTotals[ticker] = (saleTotals[ticker] ?? new BigNumber(0)).plus(
      toRaw(sale.raw),
    );
  }

  const creditedOf = (ticker) =>
    (walletTotals[ticker] ?? new BigNumber(0)).plus(
      saleTotals[ticker] ?? new BigNumber(0),
    );

  // Privacy coins are withheld unless explicitly revealed. Driven by the
  // currency document rather than a ticker check, so any future privacy coin
  // behaves the same way without touching this file.
  const concealedTickers = reveal
    ? new Set()
    : new Set(
        (currencies ?? [])
          .filter((currency) => currency.concealBalances)
          .map((currency) => currency.ticker.toUpperCase()),
      );

  const entries = (currencies ?? [])
    // A disabled currency is still audited while anything is credited in it,
    // since hiding it would drop a real balance out of the report.
    .filter(
      (currency) =>
        currency.enabled || !creditedOf(currency.ticker.toUpperCase()).isZero(),
    )
    .map((currency) => {
      const ticker = currency.ticker.toUpperCase();
      const walletCredited = walletTotals[ticker] ?? new BigNumber(0);
      const saleCredited = saleTotals[ticker] ?? new BigNumber(0);
      const credited = walletCredited.plus(saleCredited);
      // A missing liquidity value counts as zero rather than skipping the
      // currency, so a coin the bot holds none of still shows up and still
      // counts against the liquidity check.
      const reserve = toRaw(currency.liquidity);

      return {
        currency,
        ticker,
        concealed: concealedTickers.has(ticker),
        walletCredited,
        saleCredited,
        credited,
        reserve,
        headroom: reserve.minus(credited),
        isLiquid: reserve.isGreaterThanOrEqualTo(credited),
      };
    })
    .sort(
      (a, b) =>
        a.ticker.localeCompare(b.ticker) ||
        a.currency.name.localeCompare(b.currency.name),
    );

  const trackedTickers = new Set(
    (currencies ?? []).map((currency) => currency.ticker.toUpperCase()),
  );

  const untracked = [
    ...new Set([...Object.keys(walletTotals), ...Object.keys(saleTotals)]),
  ]
    .filter(
      (ticker) => !trackedTickers.has(ticker) && !creditedOf(ticker).isZero(),
    )
    .sort()
    .map((ticker) => ({ ticker, credited: creditedOf(ticker) }));

  // A concealed currency is excluded from the public solvency check on purpose:
  // a liquid/illiquid verdict that depended on it would leak whether the
  // reserve covers what is credited, which is information about the balance.
  const isLiquid =
    untracked.length === 0 &&
    entries.every((entry) => entry.concealed || entry.isLiquid);

  return {
    entries,
    isLiquid,
    items:
      getSortedInventory(
        heldItems,
        creatures ?? [],
        currencies ?? [],
        bonuses ?? [],
      ) ?? [],
    untracked,
  };
}

/**
 * A concealed currency gets no verdict mark. Publishing one would disclose
 * whether its reserve covers what is credited, which is information about the
 * balance the currency is configured to withhold.
 */
function getVerdictMarker(entry) {
  if (entry.concealed) {
    return CONCEALED_MARKER;
  }
  return entry.isLiquid ? "✅" : "❌";
}

/** Verdict, then whatever qualifies it, as the summary panel's body text. */
function formatSummaryNotes(ledger, hasFilters) {
  const { entries, isLiquid, untracked } = ledger;

  const notes = [
    isLiquid ? "## The Bot is Liquid ✅" : "## The Bot is Illiquid ❌",
  ];

  if (untracked.length > 0) {
    const tickers = untracked.map((entry) => entry.ticker).join(", ");
    notes.push(
      `-# ${tickers} ${
        untracked.length === 1 ? "carries a balance" : "carry balances"
      } that no configured currency describes, so the amount cannot be priced ` +
        "or backed. This is why the report reads as illiquid.",
    );
  }

  if (entries.some((entry) => entry.concealed)) {
    notes.push(
      "-# Private currencies are withheld from this report and excluded from " +
        "the liquidity check. Run this command with the reveal option as the " +
        "bot owner for the full figures.",
    );
  }

  if (hasFilters) {
    notes.push("-# Use the buttons below to audit a single currency.");
  }

  return notes.join("\n");
}

/**
 * The default panel: one row per currency showing what is credited against what
 * is held, plus the overall verdict.
 *
 * <p>Deliberately fixed in size. The per-wallet and per-creature detail lives
 * on the currency panels, so adding a currency or a creature cannot push the
 * default view past Discord's embed limits.
 */
function buildSummaryPanel(ledger, reveal, hasFilters) {
  const { entries, isLiquid, untracked } = ledger;

  const list = entries.map((entry) => ({
    name: `${entry.currency.emoji} ${entry.currency.name} ${getVerdictMarker(
      entry,
    )}`,
    value:
      `> Credited: ${formatAmount(
        entry.credited,
        entry.currency,
        entry.concealed,
      )}` +
      "\n" +
      `> Reserve: ${formatAmount(
        entry.reserve,
        entry.currency,
        entry.concealed,
      )}`,
    inline: true,
  }));

  for (const entry of untracked) {
    list.push({
      name: `${EMOJIS.RULES_ALARM} ${entry.ticker}`,
      value:
        `> Credited: **${entry.credited.toFixed(0)}** raw` +
        "\n" +
        "> Reserve: **none, no currency configured**",
      inline: true,
    });
  }

  // Concealed currencies are left out of the total, because a total that
  // included them could be differenced against the visible rows to recover the
  // hidden amount.
  const disclosed = entries.filter((entry) => !entry.concealed);

  if (disclosed.length > 1) {
    list.push({
      name:
        EMOJIS.CURRENCY_COIN +
        (disclosed.length === entries.length
          ? " __**Estimated Totals (USD)**__"
          : " __**Estimated Totals (USD, public currencies only)**__"),
      value:
        `> Credited: **$${sumDollars(disclosed, (entry) => entry.credited)}**` +
        "\n" +
        `> Reserve: **$${sumDollars(disclosed, (entry) => entry.reserve)}**`,
      inline: false,
    });
  }

  return {
    label: "ALL",
    title:
      `${EMOJIS.AUDIT_NOTES} ${COMMAND_DESCRIPTIONS.AUDIT}` +
      (reveal ? " (Full)" : ""),
    color: isLiquid ? COLORS.LIQUID_GREEN : COLORS.ERROR_RED,
    content: formatSummaryNotes(ledger, hasFilters),
    list,
  };
}

/** Verdict for a single currency, as its panel's body text. */
function formatCurrencyNotes(entry) {
  if (entry.concealed) {
    return (
      `## ${entry.currency.name} is Private ${CONCEALED_MARKER}` +
      "\n" +
      "-# Figures and the creature breakdown are withheld, and this currency " +
      "is excluded from the liquidity check. Run this command with the reveal " +
      "option as the bot owner for the full position."
    );
  }

  return entry.isLiquid
    ? `## ${entry.currency.name} is Backed ✅`
    : `## ${entry.currency.name} is Short ❌`;
}

/**
 * One currency's full position: where the credited balance comes from, what
 * backs it, and the creatures making up the sale value component.
 */
function buildCurrencyPanel(ledger, entry, reveal) {
  const { concealed, currency } = entry;

  const list = [
    {
      name: `${EMOJIS.BANK_SERVER} Wallet Balances`,
      value: `> ${formatAmount(entry.walletCredited, currency, concealed)}`,
      inline: true,
    },
    {
      name: `${EMOJIS.CREATURES_FISH} Creature Sale Value`,
      value: `> ${formatAmount(entry.saleCredited, currency, concealed)}`,
      inline: true,
    },
    {
      name: `${EMOJIS.MONEY_BAGS} Total Credited`,
      value: `> ${formatAmount(entry.credited, currency, concealed)}`,
      inline: true,
    },
    {
      name: `${EMOJIS.CURRENCY_COIN} Hot Wallet Reserve`,
      value: `> ${formatAmount(entry.reserve, currency, concealed)}`,
      inline: true,
    },
    {
      name: `${EMOJIS.TOTAL_CHART} ${
        entry.headroom.isNegative() ? "Shortfall" : "Headroom"
      }`,
      value: `> ${formatAmount(entry.headroom.abs(), currency, concealed)}`,
      inline: true,
    },
  ];

  // The creature breakdown is a component of the concealed total, so publishing
  // it would let the withheld figure be reconstructed from its parts.
  if (!concealed) {
    const owned = ledger.items.filter(
      (item) => item.creatureTicker === currency.ticker,
    );

    if (owned.length > 0) {
      const formatted = formatInventory(owned, false);
      list.push(...(Array.isArray(formatted) ? formatted : [formatted]));
    }
  }

  return {
    label: entry.ticker,
    title:
      `${currency.emoji} ${currency.name} (${currency.ticker})` +
      (reveal ? " (Full)" : ""),
    // A concealed currency has no public verdict to colour by, so it falls back
    // to the currency's own colour.
    color: concealed
      ? currency.color
      : entry.isLiquid
        ? COLORS.LIQUID_GREEN
        : COLORS.ERROR_RED,
    content: formatCurrencyNotes(entry),
    list,
  };
}

/**
 * Panels for the /audit filter buttons: the summary followed by one panel per
 * audited currency. Built from the currency list so a new coin needs no change
 * here.
 *
 * <p>Filters are omitted below two currencies, since a single filter panel
 * would only repeat the summary.
 *
 * @param {object} data - audit API response
 * @param {boolean} [reveal] - show concealed currencies. Owner only; the caller
 *   is responsible for the permission check.
 */
function buildAuditPanels(data, reveal = false) {
  const ledger = getAuditLedger(data, reveal);
  const hasFilters = ledger.entries.length > 1;
  const summary = buildSummaryPanel(ledger, reveal, hasFilters);

  if (!hasFilters) {
    return [summary];
  }

  return [
    summary,
    ...ledger.entries.map((entry) => buildCurrencyPanel(ledger, entry, reveal)),
  ];
}

/**
 * The audit as one static embed, for contexts that cannot carry filter buttons.
 * The summary only, since the per-currency detail is what the buttons are for.
 *
 * @param {object} data - audit API response
 * @param {boolean} [reveal] - show concealed currencies. Owner only; the caller
 *   is responsible for the permission check.
 */
function formatAudit(data, reveal = false) {
  const summary = buildSummaryPanel(getAuditLedger(data, reveal), reveal, false);

  return buildEmbed({
    color: summary.color,
    title: summary.title,
    description: summary.content,
    fields: summary.list,
  });
}

module.exports = {
  buildAuditPanels,
  computeAuditTotals,
  formatAudit,
  getAuditLedger,
};
