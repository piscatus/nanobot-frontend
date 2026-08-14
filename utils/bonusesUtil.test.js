const { formatBonuses, formatBonusesMessage } = require("./bonusesUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("bonusesUtil", () => {
  describe("formatBonuses", () => {
    it("formats bonus with quantity and multiplier", () => {
      const bonuses = [{ quantity: 5, name: "1.2" }];
      const result = formatBonuses(bonuses);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Sale of *5+*");
      expect(result[0].value).toContain("1.2");
      expect(result[0].value).toContain("Bonus");
      expect(result[0].inline).toBe(true);
    });

    it("cleans numeric names with parseFloat", () => {
      const bonuses = [{ quantity: 10, name: "1.50" }];
      const result = formatBonuses(bonuses);
      expect(result[0].value).toContain("1.5");
    });

    it("handles multiple bonuses", () => {
      const bonuses = [
        { quantity: 5, name: "1.2" },
        { quantity: 10, name: "1.5" },
      ];
      const result = formatBonuses(bonuses);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Sale of *5+*");
      expect(result[1].name).toBe("Sale of *10+*");
    });

    it("returns empty array for empty input", () => {
      expect(formatBonuses([])).toEqual([]);
    });
  });

  describe("formatBonusesMessage", () => {
    it("includes sell command reference", () => {
      const commands = [{ name: COMMAND_KEYS.SELL, commandId: "sell123" }];
      const result = formatBonusesMessage(commands);
      expect(result).toContain("</sell:sell123>");
      expect(result).toContain("multipliers");
    });
  });
});
