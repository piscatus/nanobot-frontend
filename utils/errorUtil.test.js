const {
  formatAdminModPermissionMessage,
  formatAdminPermissionMessage,
} = require("./errorUtil.js");

describe("errorUtil", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      HOME_SERVER_ADMINISTRATOR_ROLE_ID: "admin123",
      HOME_SERVER_MODERATOR_ROLE_ID: "mod456",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("formatAdminModPermissionMessage", () => {
    it("formats message with user mention and embed type", () => {
      const msg = formatAdminModPermissionMessage("rules", "user789");
      expect(msg).toContain("<@user789>");
      expect(msg).toContain("rules");
      expect(msg).toContain("embed as a public message");
    });

    it("includes administrator and moderator role mentions", () => {
      const msg = formatAdminModPermissionMessage("help", "user1");
      expect(msg).toContain("<@&admin123>");
      expect(msg).toContain("<@&mod456>");
    });
  });

  describe("formatAdminPermissionMessage", () => {
    it("formats message with user mention and embed type", () => {
      const msg = formatAdminPermissionMessage("currencies", "user999");
      expect(msg).toContain("<@user999>");
      expect(msg).toContain("currencies");
      expect(msg).toContain("Administrative privileges");
    });
  });
});
