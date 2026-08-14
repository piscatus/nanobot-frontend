const {
  getCommandIds,
  getCommandStatuses,
  formatMergeMessage,
  formatRequestTitleMessage,
} = require("./commandUtil.js");

describe("commandUtil", () => {
  const mockCommands = [
    { name: "wallet", commandId: "123" },
    { name: "merge", commandId: "456" },
    { name: "fish", commandId: "789" },
  ];

  describe("getCommandIds", () => {
    it("maps command names to command IDs", () => {
      const ids = getCommandIds(mockCommands);
      expect(ids.wallet).toBe("123");
      expect(ids.merge).toBe("456");
      expect(ids.fish).toBe("789");
    });

    it("returns undefined for null/undefined", () => {
      expect(getCommandIds(null)).toBeUndefined();
      expect(getCommandIds(undefined)).toBeUndefined();
    });

    it("returns empty object for empty array", () => {
      const ids = getCommandIds([]);
      expect(ids).toEqual({});
    });
  });

  describe("getCommandStatuses", () => {
    const commandsWithStatus = [
      { name: "wallet", status: "enabled" },
      { name: "fish", status: "disabled" },
    ];

    it("maps command names to statuses", () => {
      const statuses = getCommandStatuses(commandsWithStatus);
      expect(statuses.wallet).toBe("enabled");
      expect(statuses.fish).toBe("disabled");
    });

    it("returns undefined for null/undefined", () => {
      expect(getCommandStatuses(null)).toBeUndefined();
    });

    it("returns empty object for empty array", () => {
      const statuses = getCommandStatuses([]);
      expect(statuses).toEqual({});
    });
  });

  describe("formatMergeMessage", () => {
    it("formats merge message with command link and user mention", () => {
      const message = formatMergeMessage(
        mockCommands,
        "user123",
        "creatures",
        "inventory"
      );
      expect(message).toContain("</merge:456>");
      expect(message).toContain("<@user123>");
      expect(message).toContain("creatures");
      expect(message).toContain("inventory");
    });
  });

  describe("formatRequestTitleMessage", () => {
    it("capitalizes first letter of command", () => {
      expect(formatRequestTitleMessage("🎣", "user1", "fish")).toBe(
        "🎣 user1's Fish Request"
      );
    });

    it("handles single-character command", () => {
      expect(formatRequestTitleMessage("💰", "user2", "x")).toBe(
        "💰 user2's X Request"
      );
    });
  });
});
