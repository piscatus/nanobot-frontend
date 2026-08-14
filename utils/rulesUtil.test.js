const {
  formatRulesMap,
  formatServerRulesMessage,
  formatSupportRulesMessage,
  formatGeneralRulesMessage,
  formatAirdropRulesMessage,
  formatFishingRulesMessage,
} = require("./rulesUtil.js");
const { CHANNELS, COMMAND_KEYS, EMOJIS } = require("./constants.js");

describe("rulesUtil", () => {
  const mockCommands = [
    { name: COMMAND_KEYS.GIFT, commandId: "gift123" },
    { name: COMMAND_KEYS.DROP, commandId: "drop456" },
  ];

  beforeEach(() => {
    process.env.BOT_USER_ID = "bot-123";
    process.env.SUPPORT_CHANNEL_ID = "support-chan";
    process.env.HOME_SERVER_OWNER_ROLE_ID = "owner-role";
    process.env.HOME_SERVER_ADMINISTRATOR_ROLE_ID = "admin-role";
    process.env.HOME_SERVER_MODERATOR_ROLE_ID = "mod-role";
    process.env.GENERAL_CHANNEL_ID = "general-chan";
    process.env.OFF_TOPIC_CHANNEL_ID = "offtopic-chan";
    process.env.IMAGES_CHANNEL_ID = "images-chan";
    process.env.MEDIA_CHANNEL_ID = "media-chan";
    process.env.TIP_CHAT_CHANNEL_ID = "tipchat-chan";
    process.env.AIRDROPS_CHANNEL_ID = "airdrops-chan";
    process.env.FISHING_CHANNEL_ID = "fishing-chan";
    process.env.SWAPS_CHANNEL_ID = "swaps-chan";
    process.env.TRADES_CHANNEL_ID = "trades-chan";
    process.env.SUPPORT_CHANNEL_ID = "support-chan";
  });

  describe("formatRulesMap", () => {
    it("returns map with expected keys 0-10", () => {
      const result = formatRulesMap(mockCommands);
      for (let i = 0; i <= 10; i++) {
        expect(result[i]).toBeDefined();
        expect(result[i].title).toBeDefined();
        expect(result[i].desc).toBeDefined();
      }
    });

    it("includes server rules at key 10", () => {
      const result = formatRulesMap(mockCommands);
      expect(result[10].title).toContain("RULES");
      expect(result[10].desc).toContain("Be Kind");
    });

    it("includes support rules at key 9", () => {
      const result = formatRulesMap(mockCommands);
      expect(result[9].title).toContain(CHANNELS.SUPPORT.toUpperCase());
      expect(result[9].desc).toContain("Get help");
    });

    it("includes general rules at key 8", () => {
      const result = formatRulesMap(mockCommands);
      expect(result[8].title).toContain(CHANNELS.GENERAL.toUpperCase());
      expect(result[8].desc).toContain("Topical discussions");
    });

    it("includes fishing rules at key 2", () => {
      const result = formatRulesMap(mockCommands);
      expect(result[2].title).toContain(CHANNELS.FISHING.toUpperCase());
    });

    it("includes trades rules at key 0", () => {
      const result = formatRulesMap(mockCommands);
      expect(result[0].title).toContain(CHANNELS.TRADES.toUpperCase());
    });
  });

  describe("formatServerRulesMessage", () => {
    it("returns message with server rules", () => {
      const result = formatServerRulesMessage();
      expect(result).toContain("Be Kind");
      expect(result).toContain("No Begging");
      expect(result).toContain("English Only");
      expect(result).toContain("No Spamming");
    });

    it("includes warning about consequences", () => {
      const result = formatServerRulesMessage();
      expect(result).toContain("warning");
      expect(result).toContain("mute");
      expect(result).toContain("ban");
    });
  });

  describe("formatSupportRulesMessage", () => {
    it("returns message with support channel rules", () => {
      const result = formatSupportRulesMessage();
      expect(result).toContain("Get help");
      expect(result).toContain("<@bot-123>");
      expect(result).toContain("<#support-chan>");
    });
  });

  describe("formatGeneralRulesMessage", () => {
    it("includes gift command in rules", () => {
      const result = formatGeneralRulesMessage(mockCommands);
      expect(result).toContain("</gift:gift123>");
      expect(result).toContain("Topical discussions");
    });
  });

  describe("formatAirdropRulesMessage", () => {
    it("returns airdrop-specific rules", () => {
      const result = formatAirdropRulesMessage();
      expect(result).toContain("Airdrops Only");
      expect(result).toContain("$0.01");
      expect(result).toContain("3 minutes");
    });
  });

  describe("formatFishingRulesMessage", () => {
    it("returns fishing channel rules", () => {
      const result = formatFishingRulesMessage();
      expect(result).toContain("Reactions to user catches");
      expect(result).toContain("Slash Commands");
    });
  });
});
