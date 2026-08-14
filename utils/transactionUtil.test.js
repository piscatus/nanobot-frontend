const { paginateTransactions } = require("./transactionUtil.js");
const { COMMAND_KEYS, EMOJIS } = require("./constants.js");

describe("transactionUtil", () => {
  let mockInteraction;
  let mockClient;
  let collectHandler;
  let endHandler;

  beforeEach(() => {
    collectHandler = null;
    endHandler = null;

    const mockCollector = {
      on: jest.fn((event, handler) => {
        if (event === "collect") collectHandler = handler;
        if (event === "end") endHandler = handler;
        return mockCollector;
      }),
    };

    const mockReply = {
      createMessageComponentCollector: jest.fn(() => mockCollector),
    };

    mockInteraction = {
      user: { id: "user-123" },
      editReply: jest.fn().mockResolvedValue(mockReply),
    };

    mockClient = {
      buttonCooldowns: new Map(),
    };
  });

  const mockCommands = [
    { name: COMMAND_KEYS.INVENTORY, commandId: "inv123" },
    { name: COMMAND_KEYS.WALLET, commandId: "wal456" },
  ];

  const mockCurrencies = [
    {
      ticker: "NANO",
      name: "Nano",
      emoji: "💎",
      enabled: true,
      precision: 6,
      value: "1",
    },
  ];

  const mockCreatures = [
    {
      name: "FISH",
      pluralization: "fish",
      ticker: "NANO",
      value: "1000000",
      emoji: "🐟",
    },
  ];

  const mockBonuses = [];

  describe("paginateTransactions", () => {
    it("calls editReply with embed and components", async () => {
      const paginatePromise = paginateTransactions(
        mockInteraction,
        mockClient,
        "Transaction History",
        [],
        mockCommands,
        "user-123",
        mockCurrencies,
        mockCreatures,
        mockBonuses
      );

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
          fetchReply: true,
        })
      );

      await Promise.resolve();
      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("shows no transactions message when transactions array is empty", async () => {
      const paginatePromise = paginateTransactions(
        mockInteraction,
        mockClient,
        "Transaction History",
        [],
        mockCommands,
        "user-123",
        mockCurrencies,
        mockCreatures,
        mockBonuses
      );

      const editCall = mockInteraction.editReply.mock.calls[0][0];
      const embed = editCall.embeds[0];
      expect(embed.data.description).toContain("No Transactions in the Last 30 Days");

      await Promise.resolve();
      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("displays transaction when data is provided", async () => {
      const transactions = [
        {
          id: "tx-1",
          primaryUserId: "user-123",
          primaryReceiverIds: ["user-456"],
          timestamp: new Date().toISOString(),
          completedPrimaryTransfers: {
            "0": {
              wallets: [{ ticker: "NANO", raw: "1000000" }],
              items: [],
            },
          },
          completedSecondaryTransfers: {},
        },
      ];

      const paginatePromise = paginateTransactions(
        mockInteraction,
        mockClient,
        "Transaction History",
        transactions,
        mockCommands,
        "user-123",
        mockCurrencies,
        mockCreatures,
        mockBonuses
      );

      const editCall = mockInteraction.editReply.mock.calls[0][0];
      const embed = editCall.embeds[0];
      expect(embed.data.title).toBe("Transaction History");
      expect(embed.data.description).toContain(COMMAND_KEYS.INVENTORY);
      expect(embed.data.description).toContain(COMMAND_KEYS.WALLET);

      await Promise.resolve();
      endHandler?.({ size: 0 });
      await paginatePromise;
    });
  });
});
