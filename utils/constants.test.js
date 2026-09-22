const {
  BUTTON_DESCRIPTIONS,
  CHANNELS,
  COLORS,
  COMMAND_KEYS,
  COMMAND_DESCRIPTIONS,
  STATUS_CODES,
  TIME,
  NUMBERS,
  EMOJIS,
  ROLES,
  TICKER_ANY,
  TICKER_ANY_LABEL,
} = require("./constants.js");

describe("constants", () => {
  describe("BUTTON_DESCRIPTIONS", () => {
    it("has Cancel and Confirm", () => {
      expect(BUTTON_DESCRIPTIONS.CANCEL).toBe("Cancel");
      expect(BUTTON_DESCRIPTIONS.CONFIRM).toBe("Confirm");
      expect(BUTTON_DESCRIPTIONS.SEND_WHEN_READY).toBe(
        "Send as soon as possible",
      );
    });
  });

  describe("CHANNELS", () => {
    it("has expected channel keys", () => {
      expect(CHANNELS.FISHING).toBe("fishing");
      expect(CHANNELS.GENERAL).toBe("general");
    });
  });

  describe("COLORS", () => {
    it("has expected color hex values", () => {
      expect(COLORS.ERROR_RED).toBe("#FF0000");
      expect(COLORS.LIQUID_GREEN).toBe("#28a745");
    });
  });

  describe("COMMAND_KEYS", () => {
    it("has expected command keys", () => {
      expect(COMMAND_KEYS.WALLET).toBe("wallet");
      expect(COMMAND_KEYS.FISH).toBe("fish");
    });
  });

  describe("STATUS_CODES", () => {
    it("has expected HTTP status codes", () => {
      expect(STATUS_CODES.OK).toBe(200);
      expect(STATUS_CODES.ACCEPTED).toBe(202);
      expect(STATUS_CODES.NO_CONTENT).toBe(204);
    });
  });

  describe("TIME", () => {
    it("has correct time conversions", () => {
      expect(TIME.MINUTES_PER_HOUR).toBe(60);
      expect(TIME.HOURS_PER_DAY).toBe(24);
      expect(TIME.MINUTES_PER_DAY).toBe(1440);
    });
  });

  describe("NUMBERS", () => {
    it("has expected numeric constants", () => {
      expect(NUMBERS.DEFAULT_FISHING_FREQUENCY).toBe(15);
      expect(NUMBERS.MAXIMUM_ALIAS_LENGTH).toBe(50);
    });
  });

  describe("EMOJIS", () => {
    it("has expected emoji constants", () => {
      expect(EMOJIS.DEAD_SKULL).toBe("💀");
      expect(EMOJIS.FISHING_ROD).toBe("🎣");
      expect(EMOJIS.CURRENCY_COIN).toBe("💰");
    });
  });

  describe("ROLES", () => {
    it("has expected role keys", () => {
      expect(ROLES.NANO).toBe("nano");
      expect(ROLES.VIP).toBe("vip");
    });
  });

  describe("COMMAND_DESCRIPTIONS", () => {
    it("has expected command descriptions", () => {
      expect(COMMAND_DESCRIPTIONS.WALLET).toBe("Currency Balances");
      expect(COMMAND_DESCRIPTIONS.FISH).toBe("Fish for Creatures");
    });
  });

  describe("TICKER_ANY", () => {
    // Sent on the wire and compared against Constants.TICKER_ANY in the API, so
    // renaming it here alone would quietly stop users clearing their default
    it("matches the sentinel the API expects", () => {
      expect(TICKER_ANY).toBe("ANY");
    });

    it("has a label that reads next to 'Name [TICKER]' choices", () => {
      expect(TICKER_ANY_LABEL).toBe("Any");
    });
  });
});
