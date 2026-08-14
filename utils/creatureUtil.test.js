const {
  getDecimalCreatureValue,
  formatCreatures,
  formatCreatureMessage,
  formatCreatureFishingMessage,
  formatCreatureInventoryMessage,
  formatCreatureSaleMessage,
  formatCreatureBonusMessage,
  formatCreatureCommands,
  formatCreatureTransferMessage,
} = require("./creatureUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("creatureUtil", () => {
  describe("getDecimalCreatureValue", () => {
    it("converts raw amount to decimal with quantity", () => {
      const result = getDecimalCreatureValue(1000000, 6, 1, []);
      expect(result).toBe("1");
    });

    it("multiplies by quantity", () => {
      const result = getDecimalCreatureValue(1000000, 6, 5, []);
      expect(result).toBe("5");
    });

    it("applies bonus multiplier when quantity meets threshold", () => {
      const multipliers = [
        { quantity: 1, name: "1" },
        { quantity: 5, name: "1.2" },
        { quantity: 10, name: "1.5" },
      ];
      const result = getDecimalCreatureValue(1000000, 6, 5, multipliers);
      expect(result).toBe("6");
    });

    it("applies highest applicable multiplier", () => {
      const multipliers = [
        { quantity: 10, name: "1.2" },
        { quantity: 25, name: "1.5" },
        { quantity: 50, name: "2" },
      ];
      const result = getDecimalCreatureValue(1000000, 6, 25, multipliers);
      expect(result).toBe("37.5");
    });

    it("returns 0 for zero quantity", () => {
      const result = getDecimalCreatureValue(1000000, 6, 0, []);
      expect(result).toBe("0");
    });
  });

  describe("formatCreatures", () => {
    it("returns noCreatures for null creaturesDB", () => {
      const result = formatCreatures(null, []);
      expect(result.name).toBe("No Creatures");
      expect(result.value).toBe("\u200b");
    });

    it("returns noCreatures for null currenciesDB", () => {
      const result = formatCreatures([], null);
      expect(result.name).toBe("No Creatures");
    });

    it("returns noCreatures for empty arrays", () => {
      const result = formatCreatures([], []);
      expect(result.name).toBe("No Creatures");
    });

    it("returns noCreatures when no creatures match enabled currencies", () => {
      const creatures = [{ name: "Shark", ticker: "nano" }];
      const currencies = [{ ticker: "nano", enabled: false }];
      const result = formatCreatures(creatures, currencies);
      expect(result.name).toBe("No Creatures");
    });

    it("formats creatures with enabled currency", () => {
      const creatures = [
        {
          name: "Shark",
          pluralization: "sharks",
          emoji: "🦈",
          ticker: "nano",
          value: "1000000",
          odds: 5,
        },
      ];
      const currencies = [
        {
          ticker: "nano",
          enabled: true,
          precision: 6,
          value: "1",
          emoji: "💎",
        },
      ];
      const result = formatCreatures(creatures, currencies);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain("Shark");
      expect(result[0].value).toContain("1 NANO");
    });
  });

  describe("formatCreatureMessage", () => {
    it("includes creatures command reference", () => {
      const commands = [{ name: COMMAND_KEYS.CREATURES, commandId: "123" }];
      const msg = formatCreatureMessage(commands);
      expect(msg).toContain("</creatures:123>");
      expect(msg).toContain("creatures");
    });
  });

  describe("formatCreatureFishingMessage", () => {
    it("includes fish command reference", () => {
      const commands = [{ name: COMMAND_KEYS.FISH, commandId: "456" }];
      const msg = formatCreatureFishingMessage(commands);
      expect(msg).toContain("</fish:456>");
    });
  });

  describe("formatCreatureInventoryMessage", () => {
    it("includes inventory command reference", () => {
      const commands = [{ name: COMMAND_KEYS.INVENTORY, commandId: "789" }];
      const msg = formatCreatureInventoryMessage(commands);
      expect(msg).toContain("</inventory:789>");
    });
  });

  describe("formatCreatureSaleMessage", () => {
    it("includes sell command reference", () => {
      const commands = [{ name: COMMAND_KEYS.SELL, commandId: "999" }];
      const msg = formatCreatureSaleMessage(commands);
      expect(msg).toContain("</sell:999>");
    });
  });

  describe("formatCreatureBonusMessage", () => {
    it("includes bonuses command reference", () => {
      const commands = [{ name: COMMAND_KEYS.BONUSES, commandId: "111" }];
      const msg = formatCreatureBonusMessage(commands);
      expect(msg).toContain("</bonuses:111>");
    });
  });

  describe("formatCreatureTransferMessage", () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it("includes drop, gift, and rain command references", () => {
      process.env.GUILD_INTENTS_GRANTED = "false";
      const commands = [
        { name: COMMAND_KEYS.DROP, commandId: "d1" },
        { name: COMMAND_KEYS.GIFT, commandId: "g1" },
        { name: COMMAND_KEYS.RAIN, commandId: "r1" },
      ];
      const msg = formatCreatureTransferMessage(commands);
      expect(msg).toContain("</drop:d1>");
      expect(msg).toContain("</gift:g1>");
      expect(msg).toContain("</rain:r1>");
    });

    it("includes award when GUILD_INTENTS_GRANTED is true", () => {
      process.env.GUILD_INTENTS_GRANTED = "true";
      const commands = [
        { name: COMMAND_KEYS.AWARD, commandId: "a1" },
        { name: COMMAND_KEYS.DROP, commandId: "d1" },
        { name: COMMAND_KEYS.GIFT, commandId: "g1" },
        { name: COMMAND_KEYS.RAIN, commandId: "r1" },
      ];
      const msg = formatCreatureTransferMessage(commands);
      expect(msg).toContain("</award:a1>");
    });
  });

  describe("formatCreatureCommands", () => {
    it("combines all creature command messages", () => {
      const commands = [
        { name: COMMAND_KEYS.DROP, commandId: "d1" },
        { name: COMMAND_KEYS.GIFT, commandId: "g1" },
        { name: COMMAND_KEYS.RAIN, commandId: "r1" },
        { name: COMMAND_KEYS.BONUSES, commandId: "b1" },
        { name: COMMAND_KEYS.FISH, commandId: "f1" },
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.SELL, commandId: "s1" },
      ];
      const msg = formatCreatureCommands(commands);
      expect(msg).toContain("</drop:d1>");
      expect(msg).toContain("</bonuses:b1>");
      expect(msg).toContain("</fish:f1>");
      expect(msg).toContain("</inventory:i1>");
      expect(msg).toContain("</sell:s1>");
    });
  });
});
