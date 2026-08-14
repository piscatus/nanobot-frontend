const {
  getTimeDetails,
  getDetails,
  getDetailsList,
  getChannelDetails,
  getRoleDetails,
  getRoleDetailsList,
  formatConfigurationsMessage,
  serverInfoTemplate,
} = require("./serverUtil.js");
const { COMMAND_KEYS, COMMAND_OPTION_KEYS } = require("./constants.js");

describe("serverUtil", () => {
  describe("getTimeDetails", () => {
    it("returns formatted label when value is truthy and non-zero", () => {
      expect(getTimeDetails("Duration", 30)).toBe("**Duration: 30 minutes**");
    });

    it("returns fallback when value is falsy", () => {
      expect(getTimeDetails("Duration", 0, "fallback")).toBe("fallback");
      expect(getTimeDetails("Duration", null, "fallback")).toBe("fallback");
    });

    it("returns empty string fallback by default", () => {
      expect(getTimeDetails("Duration", 0)).toBe("");
    });
  });

  describe("getDetails", () => {
    it("returns formatted label when value is valid string", () => {
      expect(getDetails("Label", "value")).toBe("**Label: value**");
    });

    it("returns formatted with prefix and suffix", () => {
      expect(getDetails("Channel", "123", "<#", ">")).toBe(
        "**Channel: <#123>**",
      );
    });

    it("returns fallback for invalid string", () => {
      expect(getDetails("Label", "", "", "", "fallback")).toBe("fallback");
      expect(getDetails("Label", null, "", "", "fallback")).toBe("fallback");
    });
  });

  describe("getDetailsList", () => {
    it("returns formatted list when values array has valid strings", () => {
      expect(getDetailsList("Roles", ["id1", "id2"], "<@&", ">")).toBe(
        "**Roles: <@&id1>, <@&id2>**",
      );
    });

    it("returns fallback for empty array", () => {
      expect(getDetailsList("Roles", [], "", "", "fallback")).toBe("fallback");
    });

    it("returns fallback for invalid first element", () => {
      expect(getDetailsList("Roles", [""], "", "", "fallback")).toBe(
        "fallback",
      );
    });
  });

  describe("getChannelDetails", () => {
    it("returns channel mention format", () => {
      expect(getChannelDetails("Channel", "123", "fallback")).toBe(
        "**Channel: <#123>**",
      );
    });

    it("returns fallback for invalid id", () => {
      expect(getChannelDetails("Channel", "", "fallback")).toBe("fallback");
    });
  });

  describe("getRoleDetails", () => {
    it("returns role mention format", () => {
      expect(getRoleDetails("Role", "456", "fallback")).toBe(
        "**Role: <@&456>**",
      );
    });
  });

  describe("getRoleDetailsList", () => {
    it("returns role mentions for list", () => {
      expect(getRoleDetailsList("Roles", ["r1", "r2"], "fallback")).toBe(
        "**Roles: <@&r1>, <@&r2>**",
      );
    });
  });

  describe("formatConfigurationsMessage", () => {
    it("includes server command reference", () => {
      const commands = [{ name: COMMAND_KEYS.SERVER, commandId: "server789" }];
      const result = formatConfigurationsMessage(commands);
      expect(result).toContain("</server:server789>");
      expect(result).toContain("Server Configurations");
    });
  });

  describe("serverInfoTemplate", () => {
    it("returns template with config command references", () => {
      const commands = [
        { name: COMMAND_KEYS.CONFIG, commandId: "config123" },
      ];
      const config = {};
      const result = serverInfoTemplate(commands, config);
      expect(result).toContain("Activity Configurations");
      expect(result).toContain("Fishing Configurations");
      expect(result).toContain("Logging Configurations");
      expect(result).toContain(COMMAND_OPTION_KEYS.ACTIVITY_DURATION);
      expect(result).toContain(COMMAND_OPTION_KEYS.USERS_ACTIVE);
    });
  });
});
