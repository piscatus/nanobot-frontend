const {
  formatFishReminderMessage,
  formatFishCommandMessage,
  formatFishDefaultMessage,
  formatFishCatchMessage,
  formatFishLogMessage,
} = require("./fishUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("fishUtil", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PIRATE_EMOJI_ID: "pirate123",
      FISHING_EMOJI_ID: "fishing456",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("formatFishReminderMessage", () => {
    it("formats reminder with user mention", () => {
      expect(formatFishReminderMessage("user123")).toBe(
        "<@user123>, your fishing cooldown has ended!"
      );
    });
  });

  describe("formatFishCommandMessage", () => {
    it("returns command link when fish command exists", () => {
      const commands = [
        { name: COMMAND_KEYS.FISH, commandId: "999" },
        { name: COMMAND_KEYS.INVENTORY, commandId: "111" },
      ];
      const msg = formatFishCommandMessage(commands);
      expect(msg).toContain("</fish:999>");
      expect(msg).toContain("again!");
    });

    it("returns fallback message when fish command is missing", () => {
      const commands = [{ name: "other", commandId: "111" }];
      expect(formatFishCommandMessage(commands)).toBe("You can /fish again!");
    });
  });

  describe("formatFishCatchMessage", () => {
    const mockCommands = [
      { name: COMMAND_KEYS.INVENTORY, commandId: "inv1" },
      { name: COMMAND_KEYS.SELL, commandId: "sell1" },
    ];
    const mockCurrency = { name: "Nano", ticker: "nano", precision: 6 };
    const mockCreature = { name: "Shark", emoji: "🦈", value: 1000000, ticker: "shark" };

    it("formats catch message with user and creature", () => {
      const msg = formatFishCatchMessage(
        "user1",
        mockCreature,
        mockCurrency,
        mockCommands
      );
      expect(msg).toContain("<@user1>");
      expect(msg).toContain("SHARK");
      expect(msg).toContain("</inventory:inv1>");
      expect(msg).toContain("</sell:sell1>");
    });

    it("uses 'A' for creatures starting with consonant", () => {
      const msg = formatFishCatchMessage(
        "u",
        { ...mockCreature, name: "Fish" },
        mockCurrency,
        mockCommands
      );
      expect(msg).toContain("**A FISH!**");
    });

    it("uses 'AN' for creatures starting with vowel", () => {
      const msg = formatFishCatchMessage(
        "u",
        { ...mockCreature, name: "Eel" },
        mockCurrency,
        mockCommands
      );
      expect(msg).toContain("**AN EEL!**");
    });
  });

  describe("formatFishLogMessage", () => {
    const mockCommands = [{ name: COMMAND_KEYS.RESERVES, commandId: "res1" }];
    const mockCurrency = { name: "Nano", ticker: "nano", precision: 6 };
    const mockCreature = { name: "Shark", emoji: "🦈", value: 1000000, ticker: "shark" };

    it("formats log message with user and creature", () => {
      const msg = formatFishLogMessage(
        "user1",
        mockCreature,
        mockCurrency,
        mockCommands
      );
      expect(msg).toContain("<@user1>");
      expect(msg).toContain("SHARK");
      expect(msg).toContain("</reserves:res1>");
    });

    it("uses 'a' for creatures starting with consonant", () => {
      const msg = formatFishLogMessage(
        "u",
        { ...mockCreature, name: "Fish" },
        mockCurrency,
        mockCommands
      );
      expect(msg).toContain("caught a **FISH**");
    });

    it("uses 'an' for creatures starting with vowel", () => {
      const msg = formatFishLogMessage(
        "u",
        { ...mockCreature, name: "Eel" },
        mockCurrency,
        mockCommands
      );
      expect(msg).toContain("caught an **EEL**");
    });
  });

  describe("formatFishDefaultMessage", () => {
    const commands = [{ name: COMMAND_KEYS.FISH, commandId: "fish1" }];
    const currencies = [
      { ticker: "XNO", name: "Nano", emoji: ":xno:" },
      { ticker: "BAN", name: "Banano", emoji: ":ban:" },
    ];

    it("names the currency the user just defaulted to", () => {
      const msg = formatFishDefaultMessage("BAN", currencies, commands);
      expect(msg).toContain(":ban: **Banano [BAN]**");
      expect(msg).toContain("</fish:fish1>");
      expect(msg).toContain("`Any`");
    });

    it("says the default is cleared when there is no ticker", () => {
      const msg = formatFishDefaultMessage(null, currencies, commands);
      expect(msg).toContain("**any** currency's creatures");
      expect(msg).not.toContain("`Any`");
    });

    it("falls back to the bare ticker for an unknown currency", () => {
      const msg = formatFishDefaultMessage("XMR", currencies, commands);
      expect(msg).toContain("**XMR**");
    });

    it("falls back to plain text when the fish command is missing", () => {
      const msg = formatFishDefaultMessage("BAN", currencies, []);
      expect(msg).toContain("/fish");
      expect(msg).not.toContain("</fish:");
    });
  });
});
