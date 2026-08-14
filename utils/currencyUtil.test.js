const {
  getCurrencyDollarValue,
  getCurrencyDecimalValue,
  getDollarsTotal,
  formatCurrencyMessage,
  formatCurrencyReceiveMessage,
  formatCurrencySendMessage,
  formatCurrencyTransferMessage,
} = require("./currencyUtil.js");

describe("currencyUtil", () => {
  describe("getCurrencyDollarValue", () => {
    it("multiplies amount by dollar value with correct decimal places", () => {
      expect(getCurrencyDollarValue(100, 0.5, 2)).toBe("50");
      expect(getCurrencyDollarValue(1.5, 2, 2)).toBe("3");
    });

    it("pads fractional results to at least 2 decimal places", () => {
      expect(getCurrencyDollarValue(1, 1.5, 4)).toBe("1.50");
    });

    it("returns integer string when result has no fractional part", () => {
      expect(getCurrencyDollarValue(2, 1, 2)).toBe("2");
    });
  });

  describe("getCurrencyDecimalValue", () => {
    it("converts raw amount to decimal using precision", () => {
      expect(getCurrencyDecimalValue(1000000, 6)).toBe("1");
      expect(getCurrencyDecimalValue(1500000, 6)).toBe("1.5");
    });

    it("handles nano precision (30 decimals)", () => {
      const result = getCurrencyDecimalValue("1000000000000000000000000000000", 30);
      expect(result).toBe("1");
    });

    it("trims trailing zeros", () => {
      const result = getCurrencyDecimalValue(100, 2);
      expect(result).toBe("1");
    });
  });

  describe("getDollarsTotal", () => {
    it("sums wallet dollar values", () => {
      const wallets = [{ dollarValue: "10" }, { dollarValue: "5" }];
      expect(getDollarsTotal(wallets, null)).toBe("15");
    });

    it("sums item dollar values", () => {
      const items = [{ dollarValue: "3" }, { dollarValue: "2" }];
      expect(getDollarsTotal(null, items)).toBe("5");
    });

    it("sums wallets and items together", () => {
      const wallets = [{ dollarValue: "10" }];
      const items = [{ dollarValue: "5" }];
      expect(getDollarsTotal(wallets, items)).toBe("15");
    });

    it("returns 0 for null inputs", () => {
      expect(getDollarsTotal(null, null)).toBe("0");
    });
  });

  describe("formatCurrencyMessage", () => {
    it("includes currencies command reference", () => {
      const commands = [{ name: "currencies", commandId: "cur1" }];
      const msg = formatCurrencyMessage(commands);
      expect(msg).toContain("</currencies:cur1>");
    });
  });

  describe("formatCurrencyReceiveMessage", () => {
    it("includes receive command reference", () => {
      const commands = [{ name: "receive", commandId: "rec1" }];
      const msg = formatCurrencyReceiveMessage(commands);
      expect(msg).toContain("</receive:rec1>");
    });
  });

  describe("formatCurrencySendMessage", () => {
    it("includes send command reference", () => {
      const commands = [{ name: "send", commandId: "send1" }];
      const msg = formatCurrencySendMessage(commands);
      expect(msg).toContain("</send:send1>");
    });
  });

  describe("formatCurrencyTransferMessage", () => {
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
      const msg = formatCurrencyTransferMessage(commands);
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
      const msg = formatCurrencyTransferMessage(commands);
      expect(msg).toContain("</award:a1>");
    });
  });
});
