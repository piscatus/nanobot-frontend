const {
  getDepositsDisabledDesc,
  getDepositAddressDesc,
} = require("./receiveUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("receiveUtil", () => {
  describe("getDepositsDisabledDesc", () => {
    it("returns message with user mention and currency", () => {
      const result = getDepositsDisabledDesc("user123", "nano");
      expect(result).toContain("<@user123>");
      expect(result).toContain("deposits are currently disabled");
      expect(result).toContain("nano");
    });
  });

  describe("getDepositAddressDesc", () => {
    it("returns message with address and wallet command reference", () => {
      const commands = [{ name: COMMAND_KEYS.WALLET, commandId: "wallet456" }];
      const result = getDepositAddressDesc(
        "user123",
        "nano",
        commands,
        "nano_abc123",
      );
      expect(result).toContain("<@user123>");
      expect(result).toContain("NANO");
      expect(result).toContain("</wallet:wallet456>");
      expect(result).toContain("nano_abc123");
      expect(result).toContain("deposit address");
    });
  });
});
