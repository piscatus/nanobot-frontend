const { isValidEmoji } = require("./emojiUtil.js");

describe("emojiUtil", () => {
  describe("isValidEmoji", () => {
    it("returns true for server emoji format", () => {
      expect(isValidEmoji("<:smile:123456789>")).toBe(true);
      expect(isValidEmoji("<:custom_emoji:987654321>")).toBe(true);
    });

    it("returns true for animated emoji format", () => {
      expect(isValidEmoji("<a:wave:123456789>")).toBe(true);
    });

    it("returns true for default emoji names", () => {
      expect(isValidEmoji(":smile:")).toBe(true);
      expect(isValidEmoji(":thumbsup:")).toBe(true);
    });

    it("returns true for unicode emoji", () => {
      expect(isValidEmoji("😀")).toBe(true);
      expect(isValidEmoji("🎣")).toBe(true);
    });

    it("returns false for invalid strings", () => {
      expect(isValidEmoji("")).toBe(false);
      expect(isValidEmoji("plain text")).toBe(false);
      expect(isValidEmoji("<:incomplete")).toBe(false);
    });

    it("returns false for null and undefined", () => {
      expect(isValidEmoji(null)).toBe(false);
      expect(isValidEmoji(undefined)).toBe(false);
    });

    it("returns false for numeric emoji format without colons", () => {
      expect(isValidEmoji(":123:")).toBe(true); // default emoji name format
      expect(isValidEmoji("123")).toBe(false);
    });
  });
});
