const {
  formatSupportHelp,
  formatSalesHelp,
  formatUpdatesHelp,
  formatDepositsHelp,
  formatGeneralHelp,
  formatFishingHelp,
  formatGiftHelp,
  formatRainHelp,
  formatDropsHelp,
  formatAwardsHelp,
  formatWithdrawalsHelp,
} = require("./helpUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("helpUtil", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      SUPPORT_CHANNEL_ID: "support123",
      HOME_SERVER_INVITE_URL: "https://discord.gg/test",
      EMAIL_URL: "mailto:support@example.com",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("formatSupportHelp", () => {
    it("returns support message with channel and invite", () => {
      const msg = formatSupportHelp();
      expect(msg).toContain("Discord server");
      expect(msg).toContain("support");
      expect(msg).toContain("<#support123>");
      expect(msg).toContain("https://discord.gg/test");
      expect(msg).toContain("mailto:support@example.com");
    });
  });

  describe("formatSalesHelp", () => {
    it("includes inventory, wallet, and sell command references", () => {
      const commands = [
        { name: COMMAND_KEYS.INVENTORY, commandId: "inv1" },
        { name: COMMAND_KEYS.WALLET, commandId: "wal1" },
        { name: COMMAND_KEYS.SELL, commandId: "sell1" },
      ];
      const msg = formatSalesHelp(commands);
      expect(msg).toContain("</inventory:inv1>");
      expect(msg).toContain("</wallet:wal1>");
      expect(msg).toContain("</sell:sell1>");
    });

    it("includes example sell commands", () => {
      const commands = [
        { name: COMMAND_KEYS.INVENTORY, commandId: "1" },
        { name: COMMAND_KEYS.WALLET, commandId: "2" },
        { name: COMMAND_KEYS.SELL, commandId: "3" },
      ];
      const msg = formatSalesHelp(commands);
      expect(msg).toContain("/sell");
      expect(msg).toContain("all turtles");
      expect(msg).toContain("Bulk sale bonus");
    });
  });

  describe("formatUpdatesHelp", () => {
    it("includes receive and update command references", () => {
      const commands = [
        { name: COMMAND_KEYS.RECEIVE, commandId: "rec1" },
        { name: COMMAND_KEYS.UPDATE, commandId: "upd1" },
      ];
      const msg = formatUpdatesHelp(commands);
      expect(msg).toContain("</receive:rec1>");
      expect(msg).toContain("</update:upd1>");
    });

    it("includes confirmation and spam messages", () => {
      const commands = [
        { name: COMMAND_KEYS.RECEIVE, commandId: "1" },
        { name: COMMAND_KEYS.UPDATE, commandId: "2" },
      ];
      const msg = formatUpdatesHelp(commands);
      expect(msg).toContain("confirmed and reflected on the network");
      expect(msg).toContain("Avoid spamming");
    });
  });

  describe("formatDepositsHelp", () => {
    it("includes wallet and receive command references", () => {
      const commands = [
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.RECEIVE, commandId: "r1" },
      ];
      const msg = formatDepositsHelp(commands, {});
      expect(msg).toContain("</wallet:w1>");
      expect(msg).toContain("</receive:r1>");
    });

    it("includes deposit details for enabled currencies", () => {
      const commands = [
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.RECEIVE, commandId: "r1" },
      ];
      const currencies = {
        nano: {
          minimumDeposit: "1000000",
          precision: 6,
          ticker: "nano",
          name: "Nano",
          enabled: true,
        },
      };
      const msg = formatDepositsHelp(commands, currencies);
      expect(msg).toContain("NANO");
      expect(msg).toContain("1 ");
    });
  });

  describe("formatGeneralHelp", () => {
    beforeEach(() => {
      process.env.BOT_USER_ID = "bot123";
      process.env.BOT_INVITE_URL = "https://invite.example.com";
      process.env.WEBSITE_URL = "https://nanobot.example.com";
    });

    it("includes wallet, receive, send, drop, gift, rain, fish commands", () => {
      const commands = [
        { name: COMMAND_KEYS.RECEIVE, commandId: "r1" },
        { name: COMMAND_KEYS.SEND, commandId: "s1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.DROP, commandId: "d1" },
        { name: COMMAND_KEYS.GIFT, commandId: "g1" },
        { name: COMMAND_KEYS.RAIN, commandId: "ra1" },
        { name: COMMAND_KEYS.FISH, commandId: "f1" },
      ];
      const msg = formatGeneralHelp(commands);
      expect(msg).toContain("Nanobot");
      expect(msg).toContain("</receive:r1>");
      expect(msg).toContain("</send:s1>");
      expect(msg).toContain("</drop:d1>");
      expect(msg).toContain("</gift:g1>");
      expect(msg).toContain("</rain:ra1>");
      expect(msg).toContain("</fish:f1>");
    });
  });

  describe("formatFishingHelp", () => {
    beforeEach(() => {
      process.env.BOT_USER_ID = "bot123";
    });

    it("includes inventory, fish, sell, wallet, reserves, config commands", () => {
      const commands = [
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.FISH, commandId: "f1" },
        { name: COMMAND_KEYS.SELL, commandId: "s1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.RESERVES, commandId: "r1" },
        { name: COMMAND_KEYS.CONFIG, commandId: "c1" },
        { name: COMMAND_KEYS.BONUSES, commandId: "b1" },
      ];
      const msg = formatFishingHelp(commands);
      expect(msg).toContain("</inventory:i1>");
      expect(msg).toContain("</fish:f1>");
      expect(msg).toContain("</sell:s1>");
      expect(msg).toContain("</reserves:r1>");
    });
  });

  describe("formatGiftHelp", () => {
    it("includes inventory, wallet, gift, aliases commands", () => {
      const commands = [
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.GIFT, commandId: "g1" },
        { name: COMMAND_KEYS.ALIASES, commandId: "a1" },
        { name: COMMAND_KEYS.CONFIG, commandId: "c1" },
      ];
      const msg = formatGiftHelp(commands, {});
      expect(msg).toContain("</inventory:i1>");
      expect(msg).toContain("</wallet:w1>");
      expect(msg).toContain("</gift:g1>");
    });

    it("includes gift details for enabled currencies", () => {
      const commands = [
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.GIFT, commandId: "g1" },
        { name: COMMAND_KEYS.ALIASES, commandId: "a1" },
        { name: COMMAND_KEYS.CONFIG, commandId: "c1" },
      ];
      const currencies = {
        nano: {
          minimumDeposit: "1000000",
          precision: 6,
          ticker: "nano",
          name: "Nano",
          enabled: true,
          minimumGift: "100000",
        },
      };
      const msg = formatGiftHelp(commands, currencies);
      expect(msg).toContain("NANO");
    });
  });

  describe("formatRainHelp", () => {
    it("includes active, rain, inventory, wallet commands", () => {
      const commands = [
        { name: COMMAND_KEYS.ACTIVE, commandId: "a1" },
        { name: COMMAND_KEYS.RAIN, commandId: "r1" },
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.CONFIG, commandId: "c1" },
        { name: COMMAND_KEYS.ALIASES, commandId: "al1" },
      ];
      const msg = formatRainHelp(commands, {});
      expect(msg).toContain("</active:a1>");
      expect(msg).toContain("</rain:r1>");
    });
  });

  describe("formatDropsHelp", () => {
    it("includes drop, inventory, wallet, pickup commands", () => {
      const commands = [
        { name: COMMAND_KEYS.DROP, commandId: "d1" },
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.ALIASES, commandId: "a1" },
        { name: COMMAND_KEYS.CONFIG, commandId: "c1" },
      ];
      const msg = formatDropsHelp(commands, {});
      expect(msg).toContain("</drop:d1>");
      expect(msg).toContain("30 minutes");
    });
  });

  describe("formatAwardsHelp", () => {
    it("includes award, inventory, wallet, aliases commands", () => {
      const commands = [
        { name: COMMAND_KEYS.AWARD, commandId: "aw1" },
        { name: COMMAND_KEYS.INVENTORY, commandId: "i1" },
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.ALIASES, commandId: "a1" },
      ];
      const msg = formatAwardsHelp(commands, {});
      expect(msg).toContain("</award:aw1>");
      expect(msg).toContain("</inventory:i1>");
    });
  });

  describe("formatWithdrawalsHelp", () => {
    it("includes wallet, send commands", () => {
      const commands = [
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.SEND, commandId: "s1" },
      ];
      const msg = formatWithdrawalsHelp(commands, {});
      expect(msg).toContain("</wallet:w1>");
      expect(msg).toContain("</send:s1>");
    });

    it("includes withdrawal details for enabled currencies", () => {
      const commands = [
        { name: COMMAND_KEYS.WALLET, commandId: "w1" },
        { name: COMMAND_KEYS.SEND, commandId: "s1" },
      ];
      const currencies = {
        nano: {
          minimumDeposit: "1000000",
          precision: 6,
          ticker: "nano",
          name: "Nano",
          enabled: true,
          minimumWithdraw: "1000000",
        },
      };
      const msg = formatWithdrawalsHelp(commands, currencies);
      expect(msg).toContain("NANO");
    });
  });
});
