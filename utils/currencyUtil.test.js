const {
  buildCurrencyChoices,
  buildCurrencyPanels,
  formatCurrencyRow,
  getCurrencyDollarValue,
  getCurrencyDecimalValue,
  getDecimalPlaces,
  getEffectiveMinimumWithdraw,
  getDollarsTotal,
  formatConfirmationRequirement,
  formatCurrencyMessage,
  formatCurrencyReceiveMessage,
  formatCurrencySendMessage,
  formatCurrencyTransferMessage,
  formatNetworkNotice,
  formatQuotedNetworkNotice,
} = require("./currencyUtil.js");

describe("currencyUtil", () => {
  describe("getCurrencyDollarValue", () => {
    it("multiplies amount by dollar value with correct decimal places", () => {
      expect(getCurrencyDollarValue(100, 0.5, 2)).toBe("50");
      expect(getCurrencyDollarValue(1.5, 2, 2)).toBe("3");
    });

    it("pads fractional results to at least 2 decimal places", () => {
      expect(getCurrencyDollarValue(1, 1.5, 4)).toBe("1.50");
    });

    it("returns integer string when result has no fractional part", () => {
      expect(getCurrencyDollarValue(2, 1, 2)).toBe("2");
    });
  });

  describe("getDecimalPlaces", () => {
    // The three legacy shapes, where the old precision-minus-length form agreed.
    it("matches the legacy result for a single significant digit", () => {
      expect(getDecimalPlaces("1", 30)).toBe(30);
      expect(getDecimalPlaces("100000000000000000000000", 30)).toBe(7);
      expect(getDecimalPlaces("100", 12)).toBe(10);
    });

    // The case the legacy form got wrong: a computed, fee-inclusive floor.
    it("counts every place for a multi-digit amount", () => {
      expect(getDecimalPlaces("60000001", 12)).toBe(12);
    });

    it("clamps to zero when the amount exceeds one whole unit", () => {
      expect(getDecimalPlaces("1000000000000000", 12)).toBe(0);
    });

    it("tolerates missing input", () => {
      expect(getDecimalPlaces(null, 12)).toBe(12);
    });
  });

  describe("getEffectiveMinimumWithdraw", () => {
    it("adds the fee estimate to the configured minimum", () => {
      expect(
        getEffectiveMinimumWithdraw({
          minimumWithdraw: "1",
          feeEstimate: "60000000",
        }),
      ).toBe("60000001");
    });

    it("returns the minimum unchanged on a feeless currency", () => {
      expect(getEffectiveMinimumWithdraw({ minimumWithdraw: "1" })).toBe("1");
    });
  });

  describe("formatConfirmationRequirement", () => {
    it("uses the singular for a single confirmation", () => {
      expect(formatConfirmationRequirement({ confirmations: "1" })).toBe(
        "1 network confirmation",
      );
    });

    it("uses the plural beyond one", () => {
      expect(formatConfirmationRequirement({ confirmations: "10" })).toBe(
        "10 network confirmations",
      );
    });

    // "0" is a truthy string, so a naive check rendered "after 0 confirmations".
    it("returns null for zero or missing", () => {
      expect(formatConfirmationRequirement({ confirmations: "0" })).toBeNull();
      expect(formatConfirmationRequirement({})).toBeNull();
    });

    it("emits no markdown, so callers can emphasise the sentence", () => {
      expect(formatConfirmationRequirement({ confirmations: "10" })).not.toContain(
        "*",
      );
    });
  });

  describe("formatNetworkNotice", () => {
    it("mentions a single confirmation on a feeless currency", () => {
      const notice = formatNetworkNotice({
        name: "Nano",
        ticker: "xno",
        confirmations: "1",
      });
      expect(notice).toContain("feeless");
      expect(notice).toContain("Settles after 1 network confirmation.");
    });

    it("omits the settlement line when confirmations is zero", () => {
      const notice = formatNetworkNotice({
        name: "Nano",
        ticker: "xno",
        confirmations: "0",
      });
      expect(notice).toContain("feeless");
      expect(notice).not.toContain("Settles after");
    });

    it("mentions fee and confirmations together on a fee-bearing currency", () => {
      const notice = formatNetworkNotice({
        name: "Monero",
        ticker: "xmr",
        precision: 12,
        value: "150",
        feeEstimate: "60000000",
        confirmations: "10",
      });
      expect(notice).toContain("Network Fee");
      expect(notice).toContain("Settles after 10 network confirmations.");
      expect(notice).toContain("depends on how many deposits");
    });
  });

  describe("formatQuotedNetworkNotice", () => {
    const monero = {
      name: "Monero",
      ticker: "xmr",
      precision: 12,
      value: "150",
      confirmations: "10",
    };

    it("shows the exact fee and what the recipient receives", () => {
      const notice = formatQuotedNetworkNotice(
        monero,
        "71860000",
        "10021772069",
      );
      expect(notice).toContain("Network Fee: 0.00007186 XMR");
      expect(notice).not.toContain("~");
      expect(notice).toContain("The recipient receives 0.009949912069 XMR.");
      expect(notice).toContain("Settles after 10 network confirmations.");
    });

    it("does not go negative when the fee exceeds the amount", () => {
      const notice = formatQuotedNetworkNotice(monero, "60000000", "1000");
      expect(notice).toContain("The recipient receives 0 XMR.");
    });
  });

  describe("getCurrencyDecimalValue", () => {
    it("converts raw amount to decimal using precision", () => {
      expect(getCurrencyDecimalValue(1000000, 6)).toBe("1");
      expect(getCurrencyDecimalValue(1500000, 6)).toBe("1.5");
    });

    it("handles nano precision (30 decimals)", () => {
      const result = getCurrencyDecimalValue("1000000000000000000000000000000", 30);
      expect(result).toBe("1");
    });

    it("trims trailing zeros", () => {
      const result = getCurrencyDecimalValue(100, 2);
      expect(result).toBe("1");
    });
  });

  describe("getDollarsTotal", () => {
    it("sums wallet dollar values", () => {
      const wallets = [{ dollarValue: "10" }, { dollarValue: "5" }];
      expect(getDollarsTotal(wallets, null)).toBe("15");
    });

    it("sums item dollar values", () => {
      const items = [{ dollarValue: "3" }, { dollarValue: "2" }];
      expect(getDollarsTotal(null, items)).toBe("5");
    });

    it("sums wallets and items together", () => {
      const wallets = [{ dollarValue: "10" }];
      const items = [{ dollarValue: "5" }];
      expect(getDollarsTotal(wallets, items)).toBe("15");
    });

    it("returns 0 for null inputs", () => {
      expect(getDollarsTotal(null, null)).toBe("0");
    });
  });

  describe("formatCurrencyMessage", () => {
    it("includes currencies command reference", () => {
      const commands = [{ name: "currencies", commandId: "cur1" }];
      const msg = formatCurrencyMessage(commands);
      expect(msg).toContain("</currencies:cur1>");
    });
  });

  describe("formatCurrencyReceiveMessage", () => {
    it("includes receive command reference", () => {
      const commands = [{ name: "receive", commandId: "rec1" }];
      const msg = formatCurrencyReceiveMessage(commands);
      expect(msg).toContain("</receive:rec1>");
    });
  });

  describe("formatCurrencySendMessage", () => {
    it("includes send command reference", () => {
      const commands = [{ name: "send", commandId: "send1" }];
      const msg = formatCurrencySendMessage(commands);
      expect(msg).toContain("</send:send1>");
    });
  });

  describe("formatCurrencyTransferMessage", () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it("includes drop, gift, and rain command references", () => {
      process.env.GUILD_INTENTS_GRANTED = "false";
      const commands = [
        { name: "drop", commandId: "d1" },
        { name: "gift", commandId: "g1" },
        { name: "rain", commandId: "r1" },
      ];
      const msg = formatCurrencyTransferMessage(commands);
      expect(msg).toContain("</drop:d1>");
      expect(msg).toContain("</gift:g1>");
      expect(msg).toContain("</rain:r1>");
    });

    it("includes award when GUILD_INTENTS_GRANTED is true", () => {
      process.env.GUILD_INTENTS_GRANTED = "true";
      const commands = [
        { name: "award", commandId: "a1" },
        { name: "drop", commandId: "d1" },
        { name: "gift", commandId: "g1" },
        { name: "rain", commandId: "r1" },
      ];
      const msg = formatCurrencyTransferMessage(commands);
      expect(msg).toContain("</award:a1>");
    });
  });

  describe("buildCurrencyChoices", () => {
    const nano = { ticker: "XNO", name: "Nano", enabled: true };
    const banano = { ticker: "BAN", name: "Banano", enabled: true };
    const monero = { ticker: "XMR", name: "Monero", enabled: true };

    const creatures = [
      { name: "Shrimp", ticker: "XNO" },
      { name: "Shark", ticker: "XNO" },
      { name: "Seahorse", ticker: "BAN" },
    ];

    it("labels each choice as 'Name [TICKER]' and sorts by ticker", () => {
      expect(buildCurrencyChoices([nano, banano], creatures)).toEqual([
        { name: "Banano [BAN]", value: "BAN" },
        { name: "Nano [XNO]", value: "XNO" },
      ]);
    });

    it("omits currencies that have no creatures yet", () => {
      const choices = buildCurrencyChoices([nano, banano, monero], creatures);
      expect(choices.map((choice) => choice.value)).not.toContain("XMR");
    });

    it("includes a currency as soon as it has a creature", () => {
      const choices = buildCurrencyChoices(
        [nano, banano, monero],
        [...creatures, { name: "Mole", ticker: "XMR" }],
      );
      expect(choices).toContainEqual({ name: "Monero [XMR]", value: "XMR" });
    });

    it("omits disabled currencies", () => {
      const choices = buildCurrencyChoices(
        [nano, { ...banano, enabled: false }],
        creatures,
      );
      expect(choices.map((choice) => choice.value)).toEqual(["XNO"]);
    });

    it("caps the list at the 25 choices Discord allows", () => {
      const many = Array.from({ length: 30 }, (unused, index) => ({
        ticker: `T${String(index).padStart(2, "0")}`,
        name: `Coin ${index}`,
        enabled: true,
      }));
      const stocked = many.map((currency) => ({ ticker: currency.ticker }));

      expect(buildCurrencyChoices(many, stocked)).toHaveLength(25);
    });

    it("returns nothing when either list is missing", () => {
      expect(buildCurrencyChoices(null, null)).toEqual([]);
      expect(buildCurrencyChoices([nano, banano], null)).toEqual([]);
      expect(buildCurrencyChoices(null, creatures)).toEqual([]);
    });

    it("leaves out the 'Any' choice unless it is asked for", () => {
      const choices = buildCurrencyChoices([nano, banano], creatures);
      expect(choices.map((choice) => choice.value)).not.toContain("ANY");
    });

    it("puts 'Any' first when asked, so clearing is the obvious first entry", () => {
      const choices = buildCurrencyChoices([nano, banano], creatures, {
        includeAny: true,
      });

      expect(choices).toEqual([
        { name: "Any", value: "ANY" },
        { name: "Banano [BAN]", value: "BAN" },
        { name: "Nano [XNO]", value: "XNO" },
      ]);
    });

    it("counts 'Any' against the 25 choice cap", () => {
      const many = Array.from({ length: 30 }, (unused, index) => ({
        ticker: `T${String(index).padStart(2, "0")}`,
        name: `Coin ${index}`,
        enabled: true,
      }));
      const stocked = many.map((currency) => ({ ticker: currency.ticker }));

      const choices = buildCurrencyChoices(many, stocked, {
        includeAny: true,
      });

      expect(choices).toHaveLength(25);
      expect(choices[0]).toEqual({ name: "Any", value: "ANY" });
    });

    it("offers nothing at all when no currency is stocked", () => {
      // An "Any" choice on its own would let a user clear a default they could
      // never have set
      expect(buildCurrencyChoices([nano, banano], [], { includeAny: true })).toEqual(
        [],
      );
    });
  });

  describe("buildCurrencyPanels", () => {
    const buildCurrency = (ticker, name, emoji) => ({
      ticker,
      name,
      emoji,
      enabled: true,
      color: "#000000",
      value: "1.00",
      precision: "30",
      processDeposits: true,
      processWithdrawals: true,
      minimumDrop: "1",
      minimumGift: "1",
      minimumRain: "1",
      minimumDeposit: "1",
      minimumWithdraw: "1",
      feeEstimate: "0",
    });

    const nano = buildCurrency("XNO", "Nano", "Ⓝ");
    const banano = buildCurrency("BAN", "Banano", "🍌");
    const commands = [
      { name: "currencies", commandId: "cur1" },
      { name: "receive", commandId: "rec1" },
      { name: "send", commandId: "send1" },
      { name: "wallet", commandId: "wal1" },
    ];

    it("keeps the currency heading on the ALL panel", () => {
      const [allPanel] = buildCurrencyPanels([nano, banano], commands);

      expect(allPanel.label).toBe("ALL");
      expect(allPanel.content).toMatch(/^## 🍌 \*\*Banano\*\* \(\*\*BAN\*\*\)$/m);
      expect(allPanel.content).toMatch(/^## Ⓝ \*\*Nano\*\* \(\*\*XNO\*\*\)$/m);
    });

    it("drops the heading on a filtered panel, whose title already names it", () => {
      const panels = buildCurrencyPanels([nano, banano], commands);
      const nanoPanel = panels.find((panel) => panel.label === "XNO");

      expect(nanoPanel.title).toBe("Ⓝ Nano (XNO)");
      expect(nanoPanel.content).not.toMatch(/^## /m);
      expect(nanoPanel.content).toContain("### XNO/USD : **$1.00**");
    });

    it("renders the heading by default and omits it on request", () => {
      expect(formatCurrencyRow(nano)).toMatch(/^## Ⓝ \*\*Nano\*\* \(\*\*XNO\*\*\)\n/);
      expect(formatCurrencyRow(nano, { heading: false })).toMatch(
        /^### XNO\/USD/,
      );
    });
  });
});
