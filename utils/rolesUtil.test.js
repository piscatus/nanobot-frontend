const { formatLevelRolesMessage } = require("./rolesUtil.js");
const { ROLES } = require("./constants.js");

describe("rolesUtil", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      HOME_SERVER_NANO_ROLE_ID: "nano-role",
      HOME_SERVER_NANO_ROLE_EMOJI_ID: "nano-emoji",
      HOME_SERVER_NYANO_ROLE_ID: "nyano-role",
      HOME_SERVER_NYANO_ROLE_EMOJI_ID: "nyano-emoji",
      HOME_SERVER_PICO_ROLE_ID: "pico-role",
      HOME_SERVER_PICO_ROLE_EMOJI_ID: "pico-emoji",
      HOME_SERVER_FEMTO_ROLE_ID: "femto-role",
      HOME_SERVER_FEMTO_ROLE_EMOJI_ID: "femto-emoji",
      HOME_SERVER_ATTO_ROLE_ID: "atto-role",
      HOME_SERVER_ATTO_ROLE_EMOJI_ID: "atto-emoji",
      HOME_SERVER_ZEPTO_ROLE_ID: "zepto-role",
      HOME_SERVER_ZEPTO_ROLE_EMOJI_ID: "zepto-emoji",
      HOME_SERVER_YOCTO_ROLE_ID: "yocto-role",
      HOME_SERVER_YOCTO_ROLE_EMOJI_ID: "yocto-emoji",
      BOT_SPAM_CHANNEL_ID: "spam-channel",
      LEVEL_COMMAND_ID: "level-cmd",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("formatLevelRolesMessage", () => {
    it("returns message containing level role benefits header", () => {
      const result = formatLevelRolesMessage();
      expect(result).toContain("List of Level Role Benefits");
      expect(result).toContain("Levels are a fun way to show your activity");
    });

    it("includes all level roles with correct emoji references", () => {
      const result = formatLevelRolesMessage();
      expect(result).toContain(ROLES.NANO);
      expect(result).toContain(ROLES.NYANO);
      expect(result).toContain(ROLES.PICO);
      expect(result).toContain(ROLES.FEMTO);
      expect(result).toContain(ROLES.ATTO);
      expect(result).toContain(ROLES.ZEPTO);
      expect(result).toContain(ROLES.YOCTO);
    });

    it("includes level thresholds", () => {
      const result = formatLevelRolesMessage();
      expect(result).toContain("Level 100");
      expect(result).toContain("Level 80");
      expect(result).toContain("Level 60");
      expect(result).toContain("Level 45");
      expect(result).toContain("Level 30");
      expect(result).toContain("Level 15");
      expect(result).toContain("Level 5");
    });

    it("includes spam warning", () => {
      const result = formatLevelRolesMessage();
      expect(result).toContain("spam");
      expect(result).toContain("server rules");
    });

    it("includes level command reference", () => {
      const result = formatLevelRolesMessage();
      expect(result).toContain("</level:level-cmd>");
      expect(result).toContain("<#spam-channel>");
    });
  });
});
