const {
  buildAuditPanels,
  computeAuditTotals,
  formatAudit,
  getAuditLedger,
} = require("./auditUtil.js");
const { COLORS, EMOJIS, COMMAND_DESCRIPTIONS } = require("./constants.js");

describe("auditUtil", () => {
  // NANO and BAN are comfortably backed; XMR is deliberately short and
  // concealed, so it only affects the verdict once revealed.
  const mockCurrencies = [
    {
      ticker: "NANO",
      name: "Nano",
      emoji: "💎",
      color: "#111111",
      enabled: true,
      precision: 6,
      value: "1",
      liquidity: "1000000",
    },
    {
      ticker: "BAN",
      name: "Banano",
      emoji: "🍌",
      color: "#222222",
      enabled: true,
      precision: 6,
      value: "0.01",
      liquidity: "2000000",
    },
    {
      ticker: "XMR",
      name: "Monero",
      emoji: "🔐",
      color: "#333333",
      enabled: true,
      precision: 6,
      value: "150",
      liquidity: "3000000",
      concealBalances: true,
    },
  ];

  const mockCreatures = [
    {
      name: "Fish",
      pluralization: "Fishes",
      ticker: "NANO",
      value: "1000",
      emoji: "🐟",
      capacity: 10,
      odds: "1",
    },
    {
      name: "Crab",
      pluralization: "Crabs",
      ticker: "BAN",
      value: "2000",
      emoji: "🦀",
      capacity: 10,
      odds: "1",
    },
    {
      name: "Snail",
      pluralization: "Snails",
      ticker: "XMR",
      value: "3000",
      emoji: "🐌",
      capacity: 10,
      odds: "1",
    },
  ];

  const buildData = (overrides = {}) => ({
    bonuses: [],
    currencies: mockCurrencies,
    creatures: mockCreatures,
    drops: [],
    guildsWallets: [],
    usersItems: [],
    usersWallets: [],
    ...overrides,
  });

  /** Backed on every public currency, short and concealed on XMR. */
  const buildPopulatedData = (overrides = {}) =>
    buildData({
      usersWallets: [
        {
          wallets: [
            { ticker: "NANO", raw: "500000" },
            { ticker: "BAN", raw: "1500000" },
            { ticker: "XMR", raw: "4000000" },
          ],
        },
      ],
      usersItems: [
        {
          items: [
            { name: "FISH", quantity: 2 },
            { name: "CRAB", quantity: 1 },
          ],
        },
      ],
      ...overrides,
    });

  const findEntry = (ledger, ticker) =>
    ledger.entries.find((entry) => entry.ticker === ticker);

  const findPanel = (panels, label) =>
    panels.find((panel) => panel.label === label);

  describe("computeAuditTotals", () => {
    it("sums wallet balances across users, servers, and active drops", () => {
      const { walletTotals } = computeAuditTotals(
        buildData({
          usersWallets: [{ wallets: [{ ticker: "NANO", raw: "100" }] }],
          guildsWallets: [{ wallets: [{ ticker: "NANO", raw: "20" }] }],
          drops: [{ transfer: { wallets: [{ ticker: "NANO", raw: "3" }] } }],
        }),
      );

      expect(walletTotals.NANO.toFixed(0)).toBe("123");
    });

    it("sums creature counts across users and active drops", () => {
      const { itemTotals } = computeAuditTotals(
        buildData({
          usersItems: [{ items: [{ name: "FISH", quantity: 4 }] }],
          drops: [{ transfer: { items: [{ name: "fish", quantity: 3 }] } }],
        }),
      );

      expect(itemTotals.FISH).toBe(7);
    });

    it("keys wallet totals by upper case ticker so casing cannot split a row", () => {
      const { walletTotals } = computeAuditTotals(
        buildData({
          usersWallets: [
            { wallets: [{ ticker: "nano", raw: "100" }] },
            { wallets: [{ ticker: "NANO", raw: "100" }] },
          ],
        }),
      );

      expect(Object.keys(walletTotals)).toEqual(["NANO"]);
      expect(walletTotals.NANO.toFixed(0)).toBe("200");
    });

    it("treats missing sources and unparseable amounts as zero", () => {
      const { walletTotals, itemTotals } = computeAuditTotals({
        usersWallets: [{ wallets: [{ ticker: "NANO", raw: undefined }] }],
      });

      expect(walletTotals.NANO.toFixed(0)).toBe("0");
      expect(itemTotals).toEqual({});
    });
  });

  describe("getAuditLedger", () => {
    it("returns one entry per enabled currency, sorted by ticker", () => {
      const ledger = getAuditLedger(buildData());

      expect(ledger.entries.map((entry) => entry.ticker)).toEqual([
        "BAN",
        "NANO",
        "XMR",
      ]);
    });

    it("credits wallet balances plus creature sale value", () => {
      const entry = findEntry(getAuditLedger(buildPopulatedData()), "NANO");

      // 0.5 NANO held, plus two fish selling for 0.001 NANO each.
      expect(entry.walletCredited.toFixed(0)).toBe("500000");
      expect(entry.saleCredited.toFixed(0)).toBe("2000");
      expect(entry.credited.toFixed(0)).toBe("502000");
    });

    it("reserves the currency's liquidity and reports the headroom", () => {
      const entry = findEntry(getAuditLedger(buildPopulatedData()), "NANO");

      expect(entry.reserve.toFixed(0)).toBe("1000000");
      expect(entry.headroom.toFixed(0)).toBe("498000");
      expect(entry.isLiquid).toBe(true);
    });

    it("reports a shortfall as a negative headroom", () => {
      const entry = findEntry(getAuditLedger(buildPopulatedData()), "XMR");

      expect(entry.credited.toFixed(0)).toBe("4000000");
      expect(entry.headroom.toFixed(0)).toBe("-1000000");
      expect(entry.isLiquid).toBe(false);
    });

    it("treats a missing liquidity value as a zero reserve", () => {
      const ledger = getAuditLedger(
        buildData({
          currencies: [{ ...mockCurrencies[0], liquidity: undefined }],
          usersWallets: [{ wallets: [{ ticker: "NANO", raw: "1" }] }],
        }),
      );

      expect(ledger.entries[0].reserve.toFixed(0)).toBe("0");
      expect(ledger.isLiquid).toBe(false);
    });

    it("excludes a concealed currency from the verdict when not revealed", () => {
      const ledger = getAuditLedger(buildPopulatedData());

      expect(findEntry(ledger, "XMR").concealed).toBe(true);
      expect(findEntry(ledger, "XMR").isLiquid).toBe(false);
      expect(ledger.isLiquid).toBe(true);
    });

    it("includes a concealed currency in the verdict once revealed", () => {
      const ledger = getAuditLedger(buildPopulatedData(), true);

      expect(findEntry(ledger, "XMR").concealed).toBe(false);
      expect(ledger.isLiquid).toBe(false);
    });

    it("surfaces a ticker no currency describes and fails the verdict", () => {
      const ledger = getAuditLedger(
        buildPopulatedData({
          usersWallets: [{ wallets: [{ ticker: "BTC", raw: "12266" }] }],
        }),
      );

      expect(ledger.untracked).toHaveLength(1);
      expect(ledger.untracked[0].ticker).toBe("BTC");
      expect(ledger.untracked[0].credited.toFixed(0)).toBe("12266");
      expect(ledger.isLiquid).toBe(false);
    });

    it("does not report a zero balance as an untracked ticker", () => {
      const ledger = getAuditLedger(
        buildData({
          usersWallets: [{ wallets: [{ ticker: "BTC", raw: "0" }] }],
        }),
      );

      expect(ledger.untracked).toHaveLength(0);
      expect(ledger.isLiquid).toBe(true);
    });

    it("still audits a disabled currency while anything is credited in it", () => {
      const disabled = {
        ...mockCurrencies[0],
        ticker: "OLD",
        name: "Retired",
        enabled: false,
      };
      const ledger = getAuditLedger(
        buildData({
          currencies: [...mockCurrencies, disabled],
          usersWallets: [{ wallets: [{ ticker: "OLD", raw: "500000" }] }],
        }),
      );

      expect(findEntry(ledger, "OLD")).toBeDefined();
      expect(ledger.untracked).toHaveLength(0);
    });

    it("omits a disabled currency with nothing credited", () => {
      const ledger = getAuditLedger(
        buildData({
          currencies: [
            ...mockCurrencies,
            { ...mockCurrencies[0], ticker: "OLD", enabled: false },
          ],
        }),
      );

      expect(findEntry(ledger, "OLD")).toBeUndefined();
    });
  });

  describe("buildAuditPanels", () => {
    it("returns a summary panel plus one per audited currency", () => {
      const panels = buildAuditPanels(buildPopulatedData());

      expect(panels.map((panel) => panel.label)).toEqual([
        "ALL",
        "BAN",
        "NANO",
        "XMR",
      ]);
    });

    it("omits filter panels below two currencies", () => {
      const panels = buildAuditPanels(
        buildData({ currencies: [mockCurrencies[0]] }),
      );

      expect(panels).toHaveLength(1);
      expect(panels[0].label).toBe("ALL");
    });

    it("keeps the summary a fixed size as creatures grow", () => {
      const summary = findPanel(buildAuditPanels(buildPopulatedData()), "ALL");
      const busier = findPanel(
        buildAuditPanels(
          buildPopulatedData({
            usersItems: [
              {
                items: [
                  { name: "FISH", quantity: 9 },
                  { name: "CRAB", quantity: 9 },
                  { name: "SNAIL", quantity: 9 },
                ],
              },
            ],
          }),
        ),
        "ALL",
      );

      // Three currency rows plus the public USD total, regardless of holdings.
      expect(summary.list).toHaveLength(4);
      expect(busier.list).toHaveLength(4);
    });

    it("shows what is credited against what is held on each summary row", () => {
      const summary = findPanel(buildAuditPanels(buildPopulatedData()), "ALL");
      const nano = summary.list.find((field) => field.name.includes("Nano"));

      expect(nano.name).toContain("✅");
      expect(nano.value).toContain("Credited: **0.502 NANO**");
      expect(nano.value).toContain("Reserve: **1 NANO**");
    });

    it("adds an untracked row explaining an otherwise silent illiquid verdict", () => {
      const summary = findPanel(
        buildAuditPanels(
          buildPopulatedData({
            usersWallets: [{ wallets: [{ ticker: "BTC", raw: "12266" }] }],
          }),
        ),
        "ALL",
      );

      const untracked = summary.list.find((field) =>
        field.name.includes("BTC"),
      );

      expect(untracked.value).toContain("12266");
      expect(untracked.value).toContain("no currency configured");
      expect(summary.content).toContain("Illiquid");
      expect(summary.content).toContain("cannot be priced");
    });

    it("withholds a concealed currency's figures and verdict", () => {
      const panels = buildAuditPanels(buildPopulatedData());
      const summary = findPanel(panels, "ALL");
      const monero = summary.list.find((field) => field.name.includes("Monero"));

      expect(monero.name).toContain("🔒");
      expect(monero.name).not.toContain("❌");
      expect(monero.value).toContain("?????");
      expect(monero.value).not.toContain("4 XMR");

      // The USD total would otherwise be differenced against the visible rows.
      const total = summary.list.find((field) => field.name.includes("Total"));
      expect(total.name).toContain("public currencies only");
    });

    it("reveals a concealed currency's real figures for the owner", () => {
      const summary = findPanel(
        buildAuditPanels(buildPopulatedData(), true),
        "ALL",
      );
      const monero = summary.list.find((field) => field.name.includes("Monero"));

      expect(monero.name).toContain("❌");
      expect(monero.value).toContain("Credited: **4 XMR**");
      expect(monero.value).not.toContain("?????");
    });

    it("breaks a currency panel down into its liability and reserve", () => {
      const nano = findPanel(buildAuditPanels(buildPopulatedData()), "NANO");
      const names = nano.list.map((field) => field.name);

      expect(names[0]).toContain("Wallet Balances");
      expect(names[1]).toContain("Creature Sale Value");
      expect(names[2]).toContain("Total Credited");
      expect(names[3]).toContain("Hot Wallet Reserve");
      expect(names[4]).toContain("Headroom");
      expect(nano.content).toContain("Nano is Backed ✅");
      expect(nano.color).toBe(COLORS.LIQUID_GREEN);
    });

    it("labels a negative headroom as a shortfall", () => {
      const monero = findPanel(
        buildAuditPanels(buildPopulatedData(), true),
        "XMR",
      );

      expect(monero.list[4].name).toContain("Shortfall");
      expect(monero.list[4].value).toContain("1 XMR");
      expect(monero.content).toContain("Monero is Short ❌");
      expect(monero.color).toBe(COLORS.ERROR_RED);
    });

    it("lists only the creatures priced in the panel's currency", () => {
      const panels = buildAuditPanels(buildPopulatedData());
      const creatureFields = (label) =>
        findPanel(panels, label)
          .list.slice(5)
          .map((field) => field.name)
          .join(" ");

      expect(creatureFields("NANO")).toContain("Fishes");
      expect(creatureFields("NANO")).not.toContain("Crabs");
      expect(creatureFields("BAN")).toContain("Crab");
      expect(creatureFields("BAN")).not.toContain("Fishes");
    });

    it("withholds the creature breakdown on a concealed currency panel", () => {
      const monero = findPanel(
        buildAuditPanels(
          buildPopulatedData({
            usersItems: [{ items: [{ name: "SNAIL", quantity: 2 }] }],
          }),
        ),
        "XMR",
      );

      expect(monero.list).toHaveLength(5);
      expect(JSON.stringify(monero.list)).not.toContain("Snail");
      expect(monero.content).toContain("Monero is Private");
      expect(monero.color).toBe(mockCurrencies[2].color);
    });

    it("marks the title as full only when revealing", () => {
      expect(findPanel(buildAuditPanels(buildPopulatedData()), "ALL").title).not.toContain(
        "(Full)",
      );
      expect(
        findPanel(buildAuditPanels(buildPopulatedData(), true), "ALL").title,
      ).toContain("(Full)");
    });
  });

  describe("formatAudit", () => {
    it("returns an embed titled for the audit command", () => {
      const result = formatAudit(buildData());

      expect(result.data.title).toContain(EMOJIS.AUDIT_NOTES);
      expect(result.data.title).toContain(COMMAND_DESCRIPTIONS.AUDIT);
    });

    it("returns liquid status when reserves cover what is credited", () => {
      const result = formatAudit(buildPopulatedData());

      expect(result.data.color).toBe(0x28a745);
      expect(result.data.description).toContain("Liquid");
    });

    it("returns illiquid status when what is credited exceeds reserves", () => {
      const result = formatAudit(
        buildPopulatedData({
          usersWallets: [{ wallets: [{ ticker: "NANO", raw: "999999999" }] }],
        }),
      );

      expect(result.data.color).toBe(0xff0000);
      expect(result.data.description).toContain("Illiquid");
    });

    it("carries the per-currency rows as embed fields", () => {
      const result = formatAudit(buildPopulatedData());

      expect(result.data.fields.length).toBeGreaterThan(0);
      expect(
        result.data.fields.some((field) => field.name.includes("Nano")),
      ).toBe(true);
    });

    it("does not point at filter buttons it cannot render", () => {
      const result = formatAudit(buildPopulatedData());

      expect(result.data.description).not.toContain("buttons below");
    });

    it("handles empty data", () => {
      const result = formatAudit(buildData());

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });
});
