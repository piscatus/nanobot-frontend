const { buildCriteriaList, getConfirmationInfo } = require("./transferUtil.js");
const { COMMAND_KEYS, EMOJIS } = require("./constants.js");

describe("transferUtil", () => {
  describe("buildCriteriaList", () => {
    it("returns empty array for null drop", () => {
      const result = buildCriteriaList(null, false);
      expect(result).toEqual([]);
    });

    it("includes duration when drop has duration", () => {
      const drop = { duration: 60 };
      const result = buildCriteriaList(drop, false);
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain("Duration");
      expect(result[0].value).toContain("1 hour");
    });

    it("uses Activity Duration label when no endTime", () => {
      const drop = { duration: 30 };
      const result = buildCriteriaList(drop, false);
      expect(result[0].name).toContain("Activity Duration");
    });

    it("uses Drop Duration label when has endTime", () => {
      const drop = { duration: 30, endTime: "2025-01-01T00:00:00Z" };
      const result = buildCriteriaList(drop, false);
      expect(result[0].name).toContain("Drop Duration");
    });

    it("includes drop end timestamp when displayTimestamp is true", () => {
      const drop = {
        duration: 30,
        endTime: "2025-03-15T12:00:00.000Z",
      };
      const result = buildCriteriaList(drop, true);
      const timestampField = result.find((r) => r.name?.includes("Drop Ends"));
      expect(timestampField).toBeDefined();
      expect(timestampField.value).toContain("<t:");
      expect(timestampField.value).toContain(":R>");
    });

    it("includes maximum entries when valid", () => {
      const drop = { duration: 30, maximumEntries: "100" };
      const result = buildCriteriaList(drop, false);
      const maxField = result.find((r) =>
        r.name?.includes("Maximum Entries") || r.name?.includes("Most Recently")
      );
      expect(maxField).toBeDefined();
      expect(maxField.value).toContain("100");
    });

    it("includes number of winners when valid", () => {
      const drop = { duration: 30, numberWinners: 5 };
      const result = buildCriteriaList(drop, false);
      const winnersField = result.find((r) =>
        r.name?.includes("Random Winners")
      );
      expect(winnersField).toBeDefined();
      expect(winnersField.value).toContain("5");
    });

    it("includes required role when present", () => {
      const drop = { duration: 30, requiredRole: "role123" };
      const result = buildCriteriaList(drop, false);
      const roleField = result.find((r) => r.name?.includes("Required Role"));
      expect(roleField).toBeDefined();
      expect(roleField.value).toContain("<@&role123>");
    });

    it("labels the field Maximum Winners when drop has trivia", () => {
      const drop = {
        duration: 30,
        maximumEntries: "5",
        trivia: { question: "What is 2+2?" },
      };
      const result = buildCriteriaList(drop, false);
      const maxField = result.find((r) => r.name?.includes("Maximum Winners"));
      expect(maxField).toBeDefined();
      expect(maxField.name).toContain(EMOJIS.AWARD_TROPHY);
      expect(maxField.value).toContain("5");
      expect(
        result.find((r) => r.name?.includes("Maximum Entries")),
      ).toBeUndefined();
    });

    it("prepends Category and capitalized Difficulty when trivia has both", () => {
      const drop = {
        duration: 30,
        trivia: { category: "Geography", difficulty: "medium" },
      };
      const result = buildCriteriaList(drop, false);
      const categoryIndex = result.findIndex((r) =>
        r.name?.includes("Category"),
      );
      const difficultyIndex = result.findIndex((r) =>
        r.name?.includes("Difficulty"),
      );
      expect(categoryIndex).toBeGreaterThanOrEqual(0);
      expect(difficultyIndex).toBe(categoryIndex + 1);
      expect(result[categoryIndex].name).toBe(
        EMOJIS.TRIVIA_BRAIN + " Category",
      );
      expect(result[categoryIndex].value).toBe("> **Geography**");
      expect(result[difficultyIndex].name).toBe(
        EMOJIS.LEVEL_CHARTS + " Difficulty",
      );
      expect(result[difficultyIndex].value).toBe("> **Medium**");
    });

    it("omits Category and Difficulty when trivia filters are null but still labels Maximum Winners", () => {
      const drop = {
        duration: 30,
        maximumEntries: "1",
        trivia: { category: null, difficulty: null },
      };
      const result = buildCriteriaList(drop, false);
      expect(result.find((r) => r.name?.includes("Category"))).toBeUndefined();
      expect(result.find((r) => r.name?.includes("Difficulty"))).toBeUndefined();
      const maxField = result.find((r) => r.name?.includes("Maximum Winners"));
      expect(maxField).toBeDefined();
      expect(maxField.value).toContain("1");
    });

    it("omits Category and Difficulty on a plain drop without trivia", () => {
      const drop = { duration: 30, maximumEntries: "1" };
      const result = buildCriteriaList(drop, false);
      expect(result.find((r) => r.name?.includes("Category"))).toBeUndefined();
      expect(result.find((r) => r.name?.includes("Difficulty"))).toBeUndefined();
    });

    it("skips maximum entries when length >= 4", () => {
      const drop = { duration: 30, maximumEntries: "10000" };
      const result = buildCriteriaList(drop, false);
      const maxField = result.find((r) => r.name?.includes("Maximum"));
      expect(maxField).toBeUndefined();
    });

    it("skips number winners when zero", () => {
      const drop = { duration: 30, numberWinners: 0 };
      const result = buildCriteriaList(drop, false);
      const winnersField = result.find((r) =>
        r.name?.includes("Random Winners")
      );
      expect(winnersField).toBeUndefined();
    });
  });

  describe("getConfirmationInfo", () => {
    const nano = {
      ticker: "xno",
      name: "Nano",
      color: "#209ce9",
      precision: 30,
      value: "1",
      confirmations: "1",
    };

    it("mentions a single confirmation on a representative update", () => {
      const embed = getConfirmationInfo({
        userId: "user1",
        input: null,
        command: COMMAND_KEYS.UPDATE,
        address: "nano_abc",
        isComplete: false,
        optional: null,
        items: [],
        wallets: [{ ticker: "xno", raw: "0" }],
        creatures: null,
        commands: [],
        bonuses: null,
        currencies: [nano],
        drop: null,
        displayTimestamp: false,
        title: "Update",
        url: null,
        includeNotes: false,
        transactionId: null,
      });
      expect(embed.data.description).toContain(
        "Settles after 1 network confirmation.",
      );
      expect(embed.data.description).not.toContain("Network Fee");
      expect(embed.data.description).not.toContain("feeless");
    });

    it("mentions fee and confirmations on a withdrawal", () => {
      const embed = getConfirmationInfo({
        userId: "user1",
        input: "1 xmr",
        command: COMMAND_KEYS.SEND,
        address: "4abc",
        isComplete: false,
        optional: null,
        items: [],
        wallets: [{ ticker: "xmr", raw: "100000000000" }],
        creatures: null,
        commands: [],
        bonuses: null,
        currencies: [
          {
            ticker: "xmr",
            name: "Monero",
            color: "#FF6600",
            precision: 12,
            value: "150",
            feeEstimate: "60000000",
            confirmations: "10",
          },
        ],
        drop: null,
        displayTimestamp: false,
        title: "Send",
        url: null,
        includeNotes: false,
        transactionId: null,
      });
      expect(embed.data.description).toContain("Network Fee");
      expect(embed.data.description).toContain(
        "Settles after 10 network confirmations.",
      );
    });

    it("shows the quoted fee and recipient amount when the API quoted one", () => {
      const embed = getConfirmationInfo({
        userId: "user1",
        input: "0.01 xmr",
        command: COMMAND_KEYS.SEND,
        address: "4abc",
        isComplete: false,
        optional: null,
        items: [],
        wallets: [{ ticker: "xmr", raw: "10021772069" }],
        creatures: null,
        commands: [],
        bonuses: null,
        currencies: [
          {
            ticker: "xmr",
            name: "Monero",
            color: "#FF6600",
            precision: 12,
            value: "150",
            feeEstimate: "60000000",
            confirmations: "10",
          },
        ],
        drop: null,
        displayTimestamp: false,
        title: "Send",
        url: null,
        includeNotes: false,
        transactionId: null,
        networkFee: "71860000",
      });
      expect(embed.data.description).toContain("Network Fee: 0.00007186 XMR");
      expect(embed.data.description).not.toContain("~");
      expect(embed.data.description).toContain(
        "The recipient receives 0.009949912069 XMR.",
      );
    });

    it("shows the quoted fee on a completed withdrawal receipt", () => {
      const embed = getConfirmationInfo({
        userId: "user1",
        input: "0.01 xmr",
        command: COMMAND_KEYS.WITHDRAW,
        address: "4abc",
        isComplete: true,
        optional: null,
        items: [],
        wallets: [{ ticker: "xmr", raw: "10021772069" }],
        creatures: null,
        commands: [],
        bonuses: null,
        currencies: [
          {
            ticker: "xmr",
            name: "Monero",
            color: "#FF6600",
            precision: 12,
            value: "150",
            feeEstimate: "60000000",
            confirmations: "10",
          },
        ],
        drop: null,
        displayTimestamp: false,
        title: "Send",
        url: null,
        includeNotes: false,
        transactionId: "tx-1",
        networkFee: "71860000",
      });
      expect(embed.data.description).toContain(
        "debit *successfully* completed and the withdrawal is queued",
      );
      expect(embed.data.description).toContain("Network Fee: 0.00007186 XMR");
      expect(embed.data.description).not.toContain("~");
      expect(embed.data.description).toContain(
        "The recipient receives 0.009949912069 XMR.",
      );
    });
  });
});
