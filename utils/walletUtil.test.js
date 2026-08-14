const {
  getSortedWallet,
  getCurrencyInfo,
  formatWallet,
} = require("./walletUtil.js");

describe("walletUtil", () => {
  const mockCurrencies = [
    {
      ticker: "nano",
      name: "Nano",
      emoji: "💎",
      enabled: true,
      precision: 6,
      value: "1",
    },
    {
      ticker: "nyano",
      name: "Nyano",
      emoji: "💠",
      enabled: true,
      precision: 6,
      value: "0.000001",
    },
    {
      ticker: "disabled",
      name: "Disabled",
      emoji: "❌",
      enabled: false,
      precision: 6,
      value: "1",
    },
  ];

  describe("getCurrencyInfo", () => {
    it("returns currency info for valid wallet and currency", () => {
      const wallet = { ticker: "nano", raw: "1000000" };
      const result = getCurrencyInfo(wallet, mockCurrencies);
      expect(result).not.toBeNull();
      expect(result.ticker).toBe("nano");
      expect(result.name).toBe("Nano");
      expect(result.emoji).toBe("💎");
      expect(result.enabled).toBe(true);
      expect(result.value).toBe("1");
    });

    it("returns null when currency not found", () => {
      const wallet = { ticker: "unknown", raw: "1000000" };
      const result = getCurrencyInfo(wallet, mockCurrencies);
      expect(result).toBeNull();
    });

    it("calculates dollar value correctly", () => {
      const wallet = { ticker: "nano", raw: "2000000" };
      const result = getCurrencyInfo(wallet, mockCurrencies);
      expect(result.value).toBe("2");
      expect(result.dollarValue).toBe("2");
    });
  });

  describe("getSortedWallet", () => {
    it("returns null for null wallets", () => {
      expect(getSortedWallet(null, mockCurrencies)).toBeNull();
    });

    it("sorts wallets by dollar value descending", () => {
      const wallets = [
        { ticker: "nyano", raw: "1000000" },
        { ticker: "nano", raw: "1000000" },
      ];
      const result = getSortedWallet(wallets, mockCurrencies);
      expect(result).toHaveLength(2);
      expect(result[0].ticker).toBe("nano");
      expect(result[1].ticker).toBe("nyano");
    });

    it("filters out unknown currencies", () => {
      const wallets = [
        { ticker: "nano", raw: "1000000" },
        { ticker: "unknown", raw: "1000000" },
      ];
      const result = getSortedWallet(wallets, mockCurrencies);
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe("nano");
    });
  });

  describe("formatWallet", () => {
    it("returns No Currencies for null", () => {
      const result = formatWallet(null);
      expect(result.name).toBe("No Currencies");
      expect(result.value).toBe("\u200b");
    });

    it("returns No Currencies for empty array", () => {
      const result = formatWallet([]);
      expect(result.name).toBe("No Currencies");
    });

    it("returns No Currencies when all currencies have zero value", () => {
      const walletArray = [
        { ticker: "nano", enabled: true, value: "0", dollarValue: "0" },
      ];
      const result = formatWallet(walletArray);
      expect(result.name).toBe("No Currencies");
    });

    it("returns No Currencies when all currencies are disabled", () => {
      const walletArray = [
        { ticker: "nano", enabled: false, value: "1", dollarValue: "1" },
      ];
      const result = formatWallet(walletArray);
      expect(result.name).toBe("No Currencies");
    });

    it("formats single enabled currency", () => {
      const walletArray = [
        {
          ticker: "nano",
          name: "Nano",
          emoji: "💎",
          enabled: true,
          value: "1.5",
          dollarValue: "1.50",
        },
      ];
      const result = formatWallet(walletArray);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain("Nano");
      expect(result[0].value).toContain("1.5");
      expect(result[0].value).toContain("$1.50");
    });

    it("adds estimated total for multiple currencies", () => {
      const walletArray = [
        {
          ticker: "nano",
          name: "Nano",
          emoji: "💎",
          enabled: true,
          value: "1",
          dollarValue: "1",
        },
        {
          ticker: "nyano",
          name: "Nyano",
          emoji: "💠",
          enabled: true,
          value: "100",
          dollarValue: "0.0001",
        },
      ];
      const result = formatWallet(walletArray);
      expect(result).toHaveLength(3);
      const totalField = result.find((r) =>
        r.name?.includes("Estimated Currency Total")
      );
      expect(totalField).toBeDefined();
    });
  });
});
