const {
  getSortedInventory,
  getItemInfo,
  formatInventory,
  getInventorySaleWallet,
} = require("./inventoryUtil.js");

describe("inventoryUtil", () => {
  const mockCreatures = [
    {
      name: "Shark",
      pluralization: "sharks",
      emoji: "🦈",
      ticker: "nano",
      value: "1000000",
      odds: 5,
      capacity: 10,
    },
    {
      name: "Fish",
      pluralization: "fish",
      emoji: "🐟",
      ticker: "nano",
      value: "100000",
      odds: 20,
      capacity: 5,
    },
  ];

  const mockCurrencies = [
    {
      ticker: "nano",
      name: "Nano",
      emoji: "💎",
      enabled: true,
      precision: 6,
      value: "1",
    },
  ];

  const mockBonuses = [];

  describe("getItemInfo", () => {
    it("returns item info for valid item", () => {
      const item = { name: "Shark", quantity: 2 };
      const result = getItemInfo(
        item,
        mockCreatures,
        mockCurrencies,
        mockBonuses
      );
      expect(result).not.toBeNull();
      expect(result.name).toBe("Shark");
      expect(result.quantity).toBe(2);
      expect(result.pluralization).toBe("sharks");
      expect(result.creatureEmoji).toBe("🦈");
    });

    it("returns null when creature not found", () => {
      const item = { name: "Unknown", quantity: 1 };
      const result = getItemInfo(
        item,
        mockCreatures,
        mockCurrencies,
        mockBonuses
      );
      expect(result).toBeNull();
    });

    it("returns null when currency is disabled", () => {
      const disabledCurrencies = [
        { ...mockCurrencies[0], enabled: false },
      ];
      const item = { name: "Shark", quantity: 1 };
      const result = getItemInfo(
        item,
        mockCreatures,
        disabledCurrencies,
        mockBonuses
      );
      expect(result).toBeNull();
    });

    it("returns null for null item", () => {
      expect(getItemInfo(null, mockCreatures, mockCurrencies, mockBonuses)).toBeNull();
    });

    it("returns null for item without name", () => {
      expect(
        getItemInfo({ quantity: 1 }, mockCreatures, mockCurrencies, mockBonuses)
      ).toBeNull();
    });

    it("returns null when creatures or currencies is null", () => {
      const item = { name: "Shark", quantity: 1 };
      expect(getItemInfo(item, null, mockCurrencies, mockBonuses)).toBeNull();
      expect(getItemInfo(item, mockCreatures, null, mockBonuses)).toBeNull();
    });
  });

  describe("getSortedInventory", () => {
    it("returns null for null items", () => {
      expect(
        getSortedInventory(null, mockCreatures, mockCurrencies, mockBonuses)
      ).toBeNull();
    });

    it("sorts by quantity descending", () => {
      const items = [
        { name: "Fish", quantity: 5 },
        { name: "Shark", quantity: 2 },
      ];
      const result = getSortedInventory(
        items,
        mockCreatures,
        mockCurrencies,
        mockBonuses
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Fish");
      expect(result[0].quantity).toBe(5);
      expect(result[1].name).toBe("Shark");
    });
  });

  describe("formatInventory", () => {
    it("returns No Creatures for null", () => {
      const result = formatInventory(null);
      expect(result.name).toBe("No Creatures");
      expect(result.value).toBe("\u200b");
    });

    it("returns No Creatures for empty array", () => {
      const result = formatInventory([]);
      expect(result.name).toBe("No Creatures");
    });

    it("returns No Creatures when all items have zero quantity", () => {
      const itemArray = [
        {
          name: "Shark",
          pluralization: "sharks",
          quantity: 0,
          creatureEmoji: "🦈",
          currencyName: "Nano",
          value: "1",
          dollarValue: "1",
          creatureTicker: "nano",
        },
      ];
      const result = formatInventory(itemArray);
      expect(result.name).toBe("No Creatures");
    });

    it("formats single item with singular name", () => {
      const itemArray = [
        {
          name: "Shark",
          pluralization: "sharks",
          quantity: 1,
          creatureEmoji: "🦈",
          currencyName: "Nano",
          value: "1",
          dollarValue: "1",
          creatureTicker: "nano",
        },
      ];
      const result = formatInventory(itemArray);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toContain("1");
      expect(result[0].name).toContain("Shark");
      expect(result[0].value).toContain("Sell Value");
    });

    it("formats multiple items with pluralization", () => {
      const itemArray = [
        {
          name: "Shark",
          pluralization: "sharks",
          quantity: 3,
          creatureEmoji: "🦈",
          currencyName: "Nano",
          value: "3",
          dollarValue: "3",
          creatureTicker: "nano",
        },
      ];
      const result = formatInventory(itemArray);
      expect(result[0].name).toContain("3");
      expect(result[0].name).toContain("sharks");
    });

    it("adds estimated total for multiple items", () => {
      const itemArray = [
        {
          name: "Shark",
          pluralization: "sharks",
          quantity: 1,
          creatureEmoji: "🦈",
          currencyName: "Nano",
          value: "1",
          dollarValue: "1",
          creatureTicker: "nano",
        },
        {
          name: "Fish",
          pluralization: "fish",
          quantity: 2,
          creatureEmoji: "🐟",
          currencyName: "Nano",
          value: "0.2",
          dollarValue: "0.20",
          creatureTicker: "nano",
        },
      ];
      const result = formatInventory(itemArray);
      expect(result).toHaveLength(3);
      const totalField = result.find((r) =>
        r.name?.includes("Estimated Creature Total")
      );
      expect(totalField).toBeDefined();
    });

    it("includes capacity when displayCapacity is true", () => {
      const itemArray = [
        {
          name: "Shark",
          pluralization: "sharks",
          quantity: 1,
          capacity: 10,
          creatureEmoji: "🦈",
          currencyName: "Nano",
          value: "1",
          dollarValue: "1",
          creatureTicker: "nano",
        },
      ];
      const result = formatInventory(itemArray, true);
      expect(result[0].name).toContain("/ 10 ");
    });
  });

  describe("getInventorySaleWallet", () => {
    it("returns empty array for null items", () => {
      expect(
        getInventorySaleWallet(
          null,
          mockCreatures,
          mockCurrencies,
          mockBonuses
        )
      ).toEqual([]);
    });

    it("returns empty array for empty items", () => {
      expect(
        getInventorySaleWallet(
          [],
          mockCreatures,
          mockCurrencies,
          mockBonuses
        )
      ).toEqual([]);
    });

    it("converts creature sale value to raw wallet format", () => {
      const items = [{ name: "Shark", quantity: 1 }];
      const result = getInventorySaleWallet(
        items,
        mockCreatures,
        mockCurrencies,
        mockBonuses
      );
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe("nano");
      expect(result[0].raw).toBe("1000000");
    });

    it("aggregates multiple items of same currency", () => {
      const items = [
        { name: "Shark", quantity: 1 },
        { name: "Fish", quantity: 10 },
      ];
      const result = getInventorySaleWallet(
        items,
        mockCreatures,
        mockCurrencies,
        mockBonuses
      );
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe("nano");
      expect(Number(result[0].raw)).toBe(2000000);
    });
  });
});
