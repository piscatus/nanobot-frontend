const { reservesInfoTemplate } = require("./reservesUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("reservesUtil", () => {
  const mockCommands = [
    { name: COMMAND_KEYS.GIFT, commandId: "gift123" },
    { name: COMMAND_KEYS.FISH, commandId: "fish456" },
  ];

  beforeEach(() => {
    process.env.BOT_USER_ID = "bot-user-123";
  });

  describe("reservesInfoTemplate", () => {
    it("returns template containing gift command link", () => {
      const result = reservesInfoTemplate(mockCommands);
      expect(result).toContain("</gift:gift123>");
      expect(result).toContain("<@bot-user-123>");
    });

    it("returns template containing fish command link", () => {
      const result = reservesInfoTemplate(mockCommands);
      expect(result).toContain("</fish:fish456>");
    });

    it("mentions fishing reserves and community", () => {
      const result = reservesInfoTemplate(mockCommands);
      expect(result).toContain("fishing reserves");
      expect(result).toContain("community");
    });

    it("handles empty commands array", () => {
      const result = reservesInfoTemplate([]);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
