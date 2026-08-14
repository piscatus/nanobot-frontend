const { formatAudit } = require("./auditUtil.js");
const { EMOJIS, COMMAND_DESCRIPTIONS } = require("./constants.js");

describe("auditUtil", () => {
  const mockCurrencies = [
    {
      ticker: "NANO",
      name: "Nano",
      emoji: "💎",
      enabled: true,
      precision: 6,
      value: "1",
      liquidity: "1000000000000",
    },
  ];

  const mockCreatures = [
    {
      name: "FISH",
      pluralization: "fish",
      ticker: "NANO",
      value: "1000000",
      emoji: "🐟",
    },
  ];

  const mockBonuses = [];

  describe("formatAudit", () => {
    it("returns embed with audit title", () => {
      const data = {
        bonuses: mockBonuses,
        currencies: mockCurrencies,
        creatures: mockCreatures,
        usersItems: [],
        usersWallets: [],
        drops: [],
        guildsWallets: [],
      };
      const result = formatAudit(data);
      expect(result.data.title).toContain(EMOJIS.AUDIT_NOTES);
      expect(result.data.title).toContain(COMMAND_DESCRIPTIONS.AUDIT);
    });

    it("returns liquid status when grand total does not exceed liquidity", () => {
      const data = {
        bonuses: mockBonuses,
        currencies: mockCurrencies,
        creatures: mockCreatures,
        usersItems: [],
        usersWallets: [{ wallets: [{ ticker: "NANO", raw: "100" }] }],
        drops: [],
        guildsWallets: [],
      };
      const result = formatAudit(data);
      expect(result.data.color).toBe(0x28a745);
      expect(result.data.description).toContain("Liquid");
    });

    it("returns illiquid status when grand total exceeds liquidity", () => {
      const data = {
        bonuses: mockBonuses,
        currencies: mockCurrencies,
        creatures: mockCreatures,
        usersItems: [],
        usersWallets: [
          {
            wallets: [{ ticker: "NANO", raw: "999999999999999999" }],
          },
        ],
        drops: [],
        guildsWallets: [],
      };
      const result = formatAudit(data);
      expect(result.data.color).toBe(0xff0000);
      expect(result.data.description).toContain("Illiquid");
    });

    it("handles empty data", () => {
      const data = {
        bonuses: [],
        currencies: mockCurrencies,
        creatures: mockCreatures,
        usersItems: [],
        usersWallets: [],
        drops: [],
        guildsWallets: [],
      };
      const result = formatAudit(data);
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("includes total wallets section when user wallets exist", () => {
      const data = {
        bonuses: mockBonuses,
        currencies: mockCurrencies,
        creatures: mockCreatures,
        usersItems: [],
        usersWallets: [
          {
            wallets: [{ ticker: "NANO", raw: "1000000" }],
          },
        ],
        drops: [],
        guildsWallets: [],
      };
      const result = formatAudit(data);
      expect(result.data.description).toContain("Total Wallets");
    });
  });
});
