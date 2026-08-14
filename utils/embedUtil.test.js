const { buildEmbed } = require("./embedUtil.js");
const { EMOJIS, COLORS } = require("./constants.js");

describe("embedUtil", () => {
  describe("buildEmbed", () => {
    it("builds embed with title and description", () => {
      const embed = buildEmbed({ title: "Test", description: "Hello" });
      expect(embed.data.title).toBe("Test");
      expect(embed.data.description).toBe("Hello");
    });

    it("builds embed with color when not error", () => {
      const embed = buildEmbed({ color: "#28a745", title: "Success" });
      expect(embed.data.color).toBe(0x28a745);
    });

    it("uses error color and skull prefix when error is true", () => {
      const embed = buildEmbed({ error: true, title: "Error" });
      expect(embed.data.color).toBe(0xff0000);
      expect(embed.data.title).toBe(`${EMOJIS.DEAD_SKULL} Error`);
    });

    it("builds embed with fields", () => {
      const fields = [{ name: "Field 1", value: "Value 1", inline: true }];
      const embed = buildEmbed({ title: "Test", fields });
      expect(embed.data.fields).toHaveLength(1);
      expect(embed.data.fields[0].name).toBe("Field 1");
      expect(embed.data.fields[0].value).toBe("Value 1");
    });

    it("builds embed with footer", () => {
      const embed = buildEmbed({ title: "Test", footer: "Page 1 of 5" });
      expect(embed.data.footer?.text).toBe("Page 1 of 5");
    });

    it("handles empty options", () => {
      const embed = buildEmbed({});
      expect(embed).toBeDefined();
      expect(embed.data.title).toBeUndefined();
    });

    it("builds embed with url", () => {
      const embed = buildEmbed({
        title: "Link",
        url: "https://example.com",
      });
      expect(embed.data.url).toBe("https://example.com");
    });

    it("builds embed with thumbnail", () => {
      const embed = buildEmbed({
        title: "Thumb",
        thumbnail: "https://example.com/image.png",
      });
      expect(embed.data.thumbnail?.url).toBe("https://example.com/image.png");
    });
  });
});
