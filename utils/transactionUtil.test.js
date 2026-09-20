const {
  buildTransactionFilterOptions,
  filterTransactions,
  formatTransactionFooter,
  paginateTransactions,
} = require("./transactionUtil.js");
const {
  COMMAND_KEYS,
  EMOJIS,
  FILTER_ALL,
} = require("./constants.js");

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

    it("states the 30 day retention under the balances note", async () => {
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
      const description = editCall.embeds[0].data.description;
      const balancesNote = description.indexOf("to view your *current* balances!");
      const retentionNote = description.indexOf(
        "-# Transaction history is only retained for **30 days**."
      );

      expect(balancesNote).toBeGreaterThan(-1);
      expect(retentionNote).toBeGreaterThan(balancesNote);

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

  describe("filterTransactions", () => {
    const transactions = [
      { id: "a", command: COMMAND_KEYS.FISH },
      { id: "b", command: COMMAND_KEYS.RECEIVE },
      { id: "c", command: COMMAND_KEYS.FISH },
    ];

    it("keeps only the requested kind", () => {
      expect(
        filterTransactions(transactions, COMMAND_KEYS.FISH).map((t) => t.id),
      ).toEqual(["a", "c"]);
    });

    it("returns everything for the ALL sentinel or no filter", () => {
      expect(filterTransactions(transactions, FILTER_ALL)).toEqual(
        transactions,
      );
      expect(filterTransactions(transactions, null)).toEqual(transactions);
    });

    it("returns an empty list for a kind the user has none of", () => {
      expect(filterTransactions(transactions, COMMAND_KEYS.RAIN)).toEqual([]);
    });

    it("tolerates a missing list", () => {
      expect(filterTransactions(null, COMMAND_KEYS.FISH)).toEqual([]);
    });
  });

  describe("buildTransactionFilterOptions", () => {
    const transactions = [
      { id: "a", command: COMMAND_KEYS.FISH },
      { id: "b", command: COMMAND_KEYS.FISH },
      { id: "c", command: COMMAND_KEYS.RECEIVE },
      { id: "d", command: COMMAND_KEYS.SEND },
    ];

    it("leads with ALL carrying the total count", () => {
      const [first] = buildTransactionFilterOptions(transactions);
      expect(first.value).toBe(FILTER_ALL);
      expect(first.count).toBe(4);
    });

    it("counts each kind the user actually has", () => {
      const options = buildTransactionFilterOptions(transactions);
      const counts = Object.fromEntries(
        options.map((option) => [option.value, option.count]),
      );
      expect(counts[COMMAND_KEYS.FISH]).toBe(2);
      expect(counts[COMMAND_KEYS.RECEIVE]).toBe(1);
      expect(counts[COMMAND_KEYS.SEND]).toBe(1);
    });

    it("omits kinds the user has none of", () => {
      const values = buildTransactionFilterOptions(transactions).map(
        (option) => option.value,
      );
      expect(values).not.toContain(COMMAND_KEYS.RAIN);
      expect(values).not.toContain(COMMAND_KEYS.DROP);
    });

    it("uses the display order from the filter registry", () => {
      const values = buildTransactionFilterOptions(transactions).map(
        (option) => option.value,
      );
      expect(values).toEqual([
        FILTER_ALL,
        COMMAND_KEYS.RECEIVE,
        COMMAND_KEYS.SEND,
        COMMAND_KEYS.FISH,
      ]);
    });

    it("still lists a kind that only exists because it was requested", () => {
      const options = buildTransactionFilterOptions(
        transactions,
        COMMAND_KEYS.RAIN,
      );
      const rain = options.find(
        (option) => option.value === COMMAND_KEYS.RAIN,
      );
      expect(rain).toEqual(
        expect.objectContaining({ label: "Rains", count: 0 }),
      );
    });

    it("generates an entry for a command the registry does not know", () => {
      const options = buildTransactionFilterOptions([
        { id: "a", command: "teleport" },
      ]);
      expect(options).toContainEqual(
        expect.objectContaining({ value: "teleport", label: "Teleport" }),
      );
    });

    it("offers only ALL when there is nothing to filter", () => {
      expect(buildTransactionFilterOptions([])).toEqual([
        expect.objectContaining({ value: FILTER_ALL, count: 0 }),
      ]);
    });

    it("stays within the 25 options Discord allows", () => {
      const many = Array.from({ length: 40 }, (unused, index) => ({
        id: `t${index}`,
        command: `command-${index}`,
      }));
      expect(buildTransactionFilterOptions(many).length).toBe(25);
    });
  });

  describe("formatTransactionFooter", () => {
    const options = [
      { value: FILTER_ALL, label: "All Transactions" },
      { value: COMMAND_KEYS.RECEIVE, label: "Deposits" },
    ];

    it("reports position and total when unfiltered", () => {
      expect(
        formatTransactionFooter(
          options,
          FILTER_ALL,
          0,
          127,
          127,
          127,
        ),
      ).toBe("Page 1 of 127 • 127 transactions");
    });

    it("names the filter and how much of the whole it covers", () => {
      expect(
        formatTransactionFooter(options, COMMAND_KEYS.RECEIVE, 0, 2, 2, 127),
      ).toBe("Deposits • Page 1 of 2 • 2 of 127 transactions");
    });

    it("keeps the total singular when there is one transaction", () => {
      expect(
        formatTransactionFooter(options, FILTER_ALL, 0, 1, 1, 1),
      ).toBe("Page 1 of 1 • 1 transaction");
    });
  });

  describe("filter interaction", () => {
    const timestamp = new Date("2026-01-01T00:00:00Z").toISOString();
    const transactions = [
      { id: "a", command: COMMAND_KEYS.FISH, primaryReceiverIds: [], timestamp },
      { id: "b", command: COMMAND_KEYS.FISH, primaryReceiverIds: [], timestamp },
      {
        id: "c",
        command: COMMAND_KEYS.RECEIVE,
        primaryReceiverIds: [],
        timestamp,
      },
    ];

    // The collector is wired up after the first editReply resolves, so tests
    // that drive it have to let that microtask run first.
    const start = async (initialFilter) => {
      const paginatePromise = paginateTransactions(
        mockInteraction,
        mockClient,
        "Transaction History",
        transactions,
        mockCommands,
        "user-123",
        mockCurrencies,
        mockCreatures,
        mockBonuses,
        initialFilter,
      );
      await Promise.resolve();
      return paginatePromise;
    };

    const firstPayload = () => mockInteraction.editReply.mock.calls[0][0];

    const lastPayload = (updateMock) =>
      updateMock.mock.calls[updateMock.mock.calls.length - 1][0];

    const customIds = () =>
      firstPayload()
        .components.flatMap((row) => row.components)
        .map((component) => component.data.custom_id);

    it("renders a filter menu alongside the page buttons", async () => {
      const paginatePromise = await start();

      const { components } = firstPayload();
      expect(components).toHaveLength(2);
      expect(components[0].components[0].data.placeholder).toBe(
        "Filter by transaction type",
      );

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("narrows the list and resets to the first page when a filter is picked", async () => {
      const paginatePromise = await start();
      const update = jest.fn().mockResolvedValue(undefined);

      // Walk forward a page, then filter down to the single deposit.
      const [filterId, , , nextId] = customIds();

      await collectHandler({
        user: { id: "user-123" },
        customId: nextId,
        update,
      });
      mockClient.buttonCooldowns.clear();
      await collectHandler({
        user: { id: "user-123" },
        customId: filterId,
        values: [COMMAND_KEYS.RECEIVE],
        update,
      });

      const embed = lastPayload(update).embeds[0];
      expect(embed.data.footer.text).toBe(
        "Deposits • Page 1 of 1 • 1 of 3 transactions",
      );

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("opens pre-filtered when a type is supplied up front", async () => {
      const paginatePromise = await start(COMMAND_KEYS.RECEIVE);

      const embed = firstPayload().embeds[0];
      expect(embed.data.footer.text).toBe(
        "Deposits • Page 1 of 1 • 1 of 3 transactions",
      );

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("says which filter came up empty", async () => {
      const paginatePromise = await start(COMMAND_KEYS.RAIN);

      const embed = firstPayload().embeds[0];
      expect(embed.data.description).toContain("No Rains in the Last 30 Days");

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("disables the arrows when the filter leaves a single page", async () => {
      const paginatePromise = await start(COMMAND_KEYS.RECEIVE);

      const buttons = firstPayload()
        .components.flatMap((row) => row.components)
        .filter((component) => component.data.style !== undefined);
      expect(buttons).toHaveLength(4);
      expect(buttons.every((button) => button.data.disabled)).toBe(true);

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("leaves the forward arrows active when more pages remain", async () => {
      const paginatePromise = await start();

      const buttons = firstPayload()
        .components.flatMap((row) => row.components)
        .filter((component) => component.data.style !== undefined);
      const [first, prev, next, last] = buttons;
      expect(first.data.disabled).toBe(true);
      expect(prev.data.disabled).toBe(true);
      expect(next.data.disabled).toBe(false);
      expect(last.data.disabled).toBe(false);

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("keeps a transaction's number stable across filters", async () => {
      const paginatePromise = await start(COMMAND_KEYS.RECEIVE);

      // "c" is the oldest of the three, so it is #1 filtered or not.
      const embed = firstPayload().embeds[0];
      expect(embed.data.description).toContain("User Transaction #1");

      endHandler?.({ size: 0 });
      await paginatePromise;
    });
  });
});
