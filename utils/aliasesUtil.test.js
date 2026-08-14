const {
  formatDMErrorMessage,
  formatAliases,
  formatAliasMessage,
  formatGlobalMessage,
  formatServerMessage,
  rawAmountFromAliasInput,
} = require("./aliasesUtil.js");

describe("aliasesUtil", () => {
  describe("formatDMErrorMessage", () => {
    it("returns message about server aliases", () => {
      const msg = formatDMErrorMessage();
      expect(msg).toContain("Server Aliases");
      expect(msg).toContain("server");
    });
  });

  describe("formatAliases", () => {
    it("returns noAliases for null aliasesDB", () => {
      const result = formatAliases(null, []);
      expect(result.name).toBe("No Aliases");
      expect(result.value).toBe("\u200b");
    });

    it("returns noAliases for null currenciesDB", () => {
      const result = formatAliases([], null);
      expect(result.name).toBe("No Aliases");
    });

    it("returns noAliases for empty arrays", () => {
      const result = formatAliases([], []);
      expect(result.name).toBe("No Aliases");
    });
  });

  describe("formatGlobalMessage", () => {
    it("includes Global Aliases and command references", () => {
      const commands = [
        { name: "aliases", commandId: "111" },
        { name: "config", commandId: "222" },
      ];
      const msg = formatGlobalMessage(commands);
      expect(msg).toContain("Global Aliases");
      expect(msg).toContain("Server Aliases");
      expect(msg).toContain("</aliases");
      expect(msg).toContain("</config");
    });
  });

  describe("formatServerMessage", () => {
    it("includes Server Aliases and command reference", () => {
      const commands = [{ name: "aliases", commandId: "111" }];
      const msg = formatServerMessage(commands);
      expect(msg).toContain("Server Aliases");
      expect(msg).toContain("</aliases");
    });
  });

  describe("formatAliases", () => {
    it("formats aliases with valid data", () => {
      const aliasesDB = [
        {
          singular: "nice",
          plural: "nices",
          emoji: "👍",
          ticker: "nano",
          value: "6900000",
        },
      ];
      const currenciesDB = [
        {
          ticker: "nano",
          enabled: true,
          precision: 6,
          value: "1",
          emoji: "💎",
        },
      ];
      const result = formatAliases(aliasesDB, currenciesDB);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain("nice");
      expect(result[0].value).toContain("6.9 NANO");
    });

    it("filters out aliases for disabled currencies", () => {
      const aliasesDB = [
        { singular: "x", plural: "xs", emoji: "x", ticker: "nano", value: "1" },
      ];
      const currenciesDB = [
        { ticker: "nano", enabled: false, precision: 6, value: "1", emoji: "x" },
      ];
      const result = formatAliases(aliasesDB, currenciesDB);
      expect(result.name).toBe("No Aliases");
    });

    it("resolves alias input using current currency USD price", () => {
      const aliasesDB = [
        {
          singular: "buck",
          plural: "bucks",
          emoji: "💵",
          ticker: "nano",
          value: null,
          input: "$2 nano",
        },
      ];
      const currenciesDB = [
        {
          ticker: "nano",
          enabled: true,
          precision: 6,
          value: "2",
          emoji: "💎",
        },
      ];
      const result = formatAliases(aliasesDB, currenciesDB);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].value).toContain("1 NANO");
      expect(result[0].value).toContain("current rates");
      expect(result[0].value).toMatch(/\*\*\$[\d.]+\*\*/);
    });
  });

  describe("rawAmountFromAliasInput", () => {
    it("converts dollar-prefixed amount to raw", () => {
      const currency = { precision: 6, value: "2" };
      expect(rawAmountFromAliasInput("$2 nano", currency)).toBe("1000000");
    });

    it("returns null for invalid input", () => {
      expect(rawAmountFromAliasInput("", { precision: 6, value: "1" })).toBe(
        null,
      );
    });
  });

  describe("formatAliasMessage", () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it("includes drop, gift, and rain command references", () => {
      process.env.GUILD_INTENTS_GRANTED = "false";
      const commands = [
        { name: "drop", commandId: "d1" },
        { name: "gift", commandId: "g1" },
        { name: "rain", commandId: "r1" },
      ];
      const msg = formatAliasMessage("Aliases", "everywhere", commands);
      expect(msg).toContain("Aliases");
      expect(msg).toContain("everywhere");
      expect(msg).toContain("</drop:d1>");
      expect(msg).toContain("</gift:g1>");
      expect(msg).toContain("</rain:r1>");
    });

    it("includes award when GUILD_INTENTS_GRANTED is true", () => {
      process.env.GUILD_INTENTS_GRANTED = "true";
      const commands = [
        { name: "award", commandId: "a1" },
        { name: "drop", commandId: "d1" },
        { name: "gift", commandId: "g1" },
        { name: "rain", commandId: "r1" },
      ];
      const msg = formatAliasMessage("Aliases", "everywhere", commands);
      expect(msg).toContain("</award:a1>");
    });
  });
});
