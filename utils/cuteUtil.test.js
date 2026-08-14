const { formatCuteMessage } = require("./cuteUtil.js");

describe("cuteUtil", () => {
  describe("formatCuteMessage", () => {
    it("formats message with user mention and command link", () => {
      const commands = [{ name: "cute", commandId: "123" }];
      const message = formatCuteMessage("user456", commands);
      expect(message).toContain("<@user456>");
      expect(message).toContain("</cute:123>");
      expect(message).toContain("left a");
    });
  });
});
