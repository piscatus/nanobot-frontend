const {
  buildReceivePanels,
  getDepositsDisabledDesc,
  getDepositAddressDesc,
  getDepositField,
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

  describe("getDepositField", () => {
    it("mentions a single confirmation for Nano", () => {
      const field = getDepositField({
        ticker: "xno",
        emoji: "🟢",
        confirmations: "1",
      });
      expect(field.value).toBe(
        "Deposits are credited after 1 network confirmation.",
      );
      expect(field.value).not.toContain("http");
    });

    it("mentions ten confirmations for Monero", () => {
      const field = getDepositField({
        ticker: "xmr",
        emoji: "🪙",
        confirmations: "10",
      });
      expect(field.value).toBe(
        "Deposits are credited after 10 network confirmations.",
      );
    });
  });

  describe("buildReceivePanels", () => {
    const commands = [{ name: COMMAND_KEYS.WALLET, commandId: "w1" }];

    it("puts the explorer URL on the embed title and confirmations in the field", () => {
      const panels = buildReceivePanels(
        {
          commands,
          addresses: [{ ticker: "xno", address: "nano_abc" }],
          currencies: [
            {
              enabled: true,
              processDeposits: true,
              ticker: "xno",
              name: "Nano",
              emoji: "🟢",
              color: "#209ce9",
              confirmations: "1",
              explorerAccountUrl:
                "https://nanexplorer.com/nano/accounts/{value}",
            },
          ],
        },
        "user123",
      );

      expect(panels).toHaveLength(1);
      expect(panels[0].url).toBe(
        "https://nanexplorer.com/nano/accounts/nano_abc",
      );
      expect(panels[0].list.value).toContain("1 network confirmation");
      expect(panels[0].list.value).not.toContain("nanexplorer");
    });

    it("omits the title URL when the currency has no account explorer", () => {
      const panels = buildReceivePanels(
        {
          commands,
          addresses: [{ ticker: "xmr", address: "4abc" }],
          currencies: [
            {
              enabled: true,
              processDeposits: true,
              ticker: "xmr",
              name: "Monero",
              emoji: "🪙",
              color: "#FF6600",
              confirmations: "10",
            },
          ],
        },
        "user123",
      );

      expect(panels[0].url).toBeNull();
      expect(panels[0].list.value).toContain("10 network confirmations");
    });

    it("orders panels alphabetically by ticker, not by API order", () => {
      const currency = (ticker, name) => ({
        enabled: true,
        processDeposits: true,
        ticker,
        name,
        emoji: "🪙",
        color: "#000000",
      });

      const panels = buildReceivePanels(
        {
          commands,
          addresses: [
            { ticker: "xno", address: "nano_abc" },
            { ticker: "btc", address: "bc1qabc" },
            { ticker: "ban", address: "ban_abc" },
            { ticker: "xmr", address: "4abc" },
          ],
          currencies: [
            currency("XNO", "Nano"),
            currency("BAN", "Banano"),
            currency("XMR", "Monero"),
            currency("BTC", "Bitcoin"),
          ],
        },
        "user123",
      );

      expect(panels.map((panel) => panel.label)).toEqual([
        "BAN",
        "BTC",
        "XMR",
        "XNO",
      ]);
    });

    it("leaves disabled currencies out of the ordering", () => {
      const panels = buildReceivePanels(
        {
          commands,
          addresses: [{ ticker: "btc", address: "bc1qabc" }],
          currencies: [
            {
              enabled: false,
              processDeposits: true,
              ticker: "BAN",
              name: "Banano",
              emoji: "🪙",
              color: "#000000",
            },
            {
              enabled: true,
              processDeposits: true,
              ticker: "BTC",
              name: "Bitcoin",
              emoji: "🪙",
              color: "#F7931A",
            },
          ],
        },
        "user123",
      );

      expect(panels.map((panel) => panel.label)).toEqual(["BTC"]);
    });
  });
});
