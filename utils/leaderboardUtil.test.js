const {
  buildCreatureAutocompleteChoices,
  buildLeaderboardCreatureOptions,
  buildLeaderboardCurrencyOptions,
  getScopedCategories,
  paginateLeaderboard,
  resolveInitialState,
} = require("./leaderboardUtil.js");
const { COMMAND_KEYS, EMOJIS, FILTER_ALL } = require("./constants.js");

describe("leaderboardUtil", () => {
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

  describe("paginateLeaderboard", () => {
    const mockCommands = [
      { name: COMMAND_KEYS.FISH, commandId: "fish123" },
      { name: COMMAND_KEYS.INVENTORY, commandId: "inv456" },
    ];

    const mockLeaderboardData = {
      fish: {
        name: "Fish",
        pluralization: "fish",
        emoji: "🐟",
        color: "#0000ff",
        users: [
          { userId: "user-123", quantity: 10 },
          { userId: "user-456", quantity: 5 },
        ],
      },
    };

    it("calls editReply with embed and components", async () => {
      const paginatePromise = paginateLeaderboard(
        mockInteraction,
        mockClient,
        "Fishing Leaderboard",
        mockLeaderboardData,
        mockCommands,
        "user-123"
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

    it("embed contains leaderboard title and user rank", async () => {
      const paginatePromise = paginateLeaderboard(
        mockInteraction,
        mockClient,
        "Fishing Leaderboard",
        mockLeaderboardData,
        mockCommands,
        "user-123"
      );

      const editCall = mockInteraction.editReply.mock.calls[0][0];
      const embed = editCall.embeds[0];
      expect(embed.data.title).toContain(EMOJIS.LEVEL_CHARTS);
      expect(embed.data.title).toContain("Fishing Leaderboard");
      expect(embed.data.description).toContain("#1");
      expect(embed.data.description).toContain("10");

      await Promise.resolve();
      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("shows no leaderboard data when users array is empty", async () => {
      const emptyData = {
        fish: {
          name: "Fish",
          pluralization: "fish",
          emoji: "🐟",
          color: "#0000ff",
          users: [],
        },
      };

      const paginatePromise = paginateLeaderboard(
        mockInteraction,
        mockClient,
        "Fishing Leaderboard",
        emptyData,
        mockCommands,
        "user-123"
      );

      const editCall = mockInteraction.editReply.mock.calls[0][0];
      const embed = editCall.embeds[0];
      expect(embed.data.description).toContain("No Leaderboard Data");

      await Promise.resolve();
      endHandler?.({ size: 0 });
      await paginatePromise;
    });
  });

  // Two currencies of two creatures, enough to exercise scoping without
  // needing the full roster.
  const category = (name, ticker, anglers) => ({
    name,
    pluralization: `${name}s`,
    emoji: `<:${name.toLowerCase()}:123456789012345678>`,
    color: "#0000ff",
    ticker,
    users: Array.from({ length: anglers }, (unused, index) => ({
      userId: `user-${index}`,
      quantity: anglers - index,
    })),
  });

  const twoCurrencies = {
    SHRIMP: category("Shrimp", "XNO", 3),
    KRAKEN: category("Kraken", "XNO", 1),
    SEAHORSE: category("Seahorse", "BAN", 2),
  };

  const currencies = [
    { ticker: "XNO", name: "Nano", emoji: "<:xno:111111111111111111>" },
    { ticker: "BAN", name: "Banano", emoji: "<:ban:222222222222222222>" },
  ];

  describe("getScopedCategories", () => {
    it("returns everything for the ALL sentinel", () => {
      expect(getScopedCategories(twoCurrencies, FILTER_ALL)).toEqual([
        "SHRIMP",
        "KRAKEN",
        "SEAHORSE",
      ]);
    });

    it("returns only the chosen currency's creatures", () => {
      expect(getScopedCategories(twoCurrencies, "XNO")).toEqual([
        "SHRIMP",
        "KRAKEN",
      ]);
      expect(getScopedCategories(twoCurrencies, "BAN")).toEqual(["SEAHORSE"]);
    });

    it("returns nothing for a currency with no board", () => {
      expect(getScopedCategories(twoCurrencies, "XMR")).toEqual([]);
    });
  });

  describe("buildLeaderboardCurrencyOptions", () => {
    it("offers ALL plus one option per currency, counting creatures", () => {
      const options = buildLeaderboardCurrencyOptions(
        twoCurrencies,
        currencies,
      );
      expect(options.map((option) => option.value)).toEqual([
        FILTER_ALL,
        "BAN",
        "XNO",
      ]);
      expect(options[1]).toEqual(
        expect.objectContaining({
          label: "Banano [BAN]",
          description: "1 creature",
        }),
      );
      expect(options[2].description).toBe("2 creatures");
    });

    it("parses a custom emoji into the structure Discord expects", () => {
      const [, banano] = buildLeaderboardCurrencyOptions(
        twoCurrencies,
        currencies,
      );
      expect(banano.emoji).toEqual({
        animated: false,
        name: "ban",
        id: "222222222222222222",
      });
    });

    it("drops ALL once the roster outgrows a single menu", () => {
      // 26 creatures cannot fit one 25 option menu, so the currency has to be
      // chosen first for every creature to stay reachable.
      const many = {};
      for (let index = 0; index < 26; index++) {
        many[`C${index}`] = category(
          `C${index}`,
          index % 2 === 0 ? "XNO" : "BAN",
          1,
        );
      }
      const options = buildLeaderboardCurrencyOptions(many, currencies);
      expect(options.map((option) => option.value)).toEqual(["BAN", "XNO"]);
    });

    it("falls back to the ticker when the currency is unknown", () => {
      const options = buildLeaderboardCurrencyOptions(twoCurrencies, []);
      expect(options.map((option) => option.label)).toEqual([
        "All Currencies",
        "BAN",
        "XNO",
      ]);
    });
  });

  describe("buildLeaderboardCreatureOptions", () => {
    it("lists the scope's creatures with their angler counts", () => {
      expect(
        buildLeaderboardCreatureOptions(twoCurrencies, "XNO"),
      ).toEqual([
        expect.objectContaining({
          value: "SHRIMP",
          label: "Shrimp",
          description: "3 anglers",
        }),
        expect.objectContaining({
          value: "KRAKEN",
          label: "Kraken",
          description: "1 angler",
        }),
      ]);
    });

    it("lists every creature when the scope is ALL", () => {
      expect(
        buildLeaderboardCreatureOptions(twoCurrencies, FILTER_ALL),
      ).toHaveLength(3);
    });

    it("never exceeds the 25 options Discord allows", () => {
      const many = {};
      for (let index = 0; index < 40; index++) {
        many[`C${index}`] = category(`C${index}`, "XNO", 1);
      }
      expect(buildLeaderboardCreatureOptions(many, "XNO")).toHaveLength(25);
    });
  });

  describe("resolveInitialState", () => {
    it("opens on everything when the roster fits one menu", () => {
      expect(resolveInitialState(twoCurrencies)).toEqual({
        ticker: FILTER_ALL,
        category: "SHRIMP",
        currentPage: 0,
      });
    });

    it("honours a requested currency", () => {
      expect(resolveInitialState(twoCurrencies, "BAN")).toEqual(
        expect.objectContaining({ ticker: "BAN", category: "SEAHORSE" }),
      );
    });

    it("opens on a requested creature", () => {
      expect(resolveInitialState(twoCurrencies, null, "kraken")).toEqual(
        expect.objectContaining({ category: "KRAKEN" }),
      );
    });

    it("lets an explicit currency win over a creature outside it", () => {
      expect(resolveInitialState(twoCurrencies, "BAN", "KRAKEN")).toEqual(
        expect.objectContaining({ ticker: "BAN", category: "SEAHORSE" }),
      );
    });

    it("falls back when the request matches nothing", () => {
      expect(resolveInitialState(twoCurrencies, "XMR", "UNICORN")).toEqual(
        expect.objectContaining({ ticker: FILTER_ALL, category: "SHRIMP" }),
      );
    });

    it("survives an empty board", () => {
      expect(resolveInitialState({})).toEqual({
        ticker: FILTER_ALL,
        category: undefined,
        currentPage: 0,
      });
    });
  });

  describe("buildCreatureAutocompleteChoices", () => {
    const creatures = [
      { name: "Shrimp", ticker: "XNO" },
      { name: "Shark", ticker: "XNO" },
      { name: "Seahorse", ticker: "BAN" },
      { name: "Kraken", ticker: "XNO" },
    ];

    it("matches anywhere in the name, case insensitively", () => {
      expect(
        buildCreatureAutocompleteChoices(creatures, "ra").map((c) => c.value),
      ).toEqual(["KRAKEN"]);
      expect(
        buildCreatureAutocompleteChoices(creatures, "SH").map((c) => c.value),
      ).toEqual(["SHARK", "SHRIMP"]);
    });

    it("narrows to a currency once one is chosen", () => {
      expect(
        buildCreatureAutocompleteChoices(creatures, "", "BAN").map(
          (c) => c.value,
        ),
      ).toEqual(["SEAHORSE"]);
    });

    it("labels each suggestion with its ticker", () => {
      expect(buildCreatureAutocompleteChoices(creatures, "kraken")).toEqual([
        { name: "Kraken [XNO]", value: "KRAKEN" },
      ]);
    });

    it("returns everything for an empty query", () => {
      expect(buildCreatureAutocompleteChoices(creatures, "")).toHaveLength(4);
    });

    it("caps suggestions at the 25 Discord accepts", () => {
      const many = Array.from({ length: 40 }, (unused, index) => ({
        name: `Creature${index}`,
        ticker: "XNO",
      }));
      expect(buildCreatureAutocompleteChoices(many, "")).toHaveLength(25);
    });

    it("tolerates a missing list", () => {
      expect(buildCreatureAutocompleteChoices(null, "shrimp")).toEqual([]);
    });

    it("hides creatures of disabled currencies when currencies are given", () => {
      const withMonero = [...creatures, { name: "Clam", ticker: "XMR" }];
      const currencies = [
        { ticker: "XNO", enabled: true },
        { ticker: "BAN", enabled: true },
        { ticker: "XMR", enabled: false },
      ];

      expect(
        buildCreatureAutocompleteChoices(withMonero, "", null, currencies).map(
          (c) => c.value,
        ),
      ).toEqual(["KRAKEN", "SEAHORSE", "SHARK", "SHRIMP"]);
      expect(
        buildCreatureAutocompleteChoices(withMonero, "cl", null, currencies),
      ).toEqual([]);
      // Without a currency list the behaviour is unchanged.
      expect(buildCreatureAutocompleteChoices(withMonero, "cl")).toEqual([
        { name: "Clam [XMR]", value: "CLAM" },
      ]);
    });
  });

  describe("scoped navigation", () => {
    const mockCommands = [{ name: COMMAND_KEYS.FISH, commandId: "fish123" }];

    const start = async (ticker, creature) => {
      const paginatePromise = paginateLeaderboard(
        mockInteraction,
        mockClient,
        "Fishing Leaderboard",
        twoCurrencies,
        mockCommands,
        "user-0",
        currencies,
        ticker,
        creature,
      );
      await Promise.resolve();
      return paginatePromise;
    };

    const firstPayload = () => mockInteraction.editReply.mock.calls[0][0];

    const lastEmbed = () => {
      const calls = mockInteraction.editReply.mock.calls;
      return calls[calls.length - 1][0].embeds[0];
    };

    const menuIds = () =>
      firstPayload()
        .components.filter((row) => row.components[0].data.style === undefined)
        .map((row) => row.components[0].data.custom_id);

    it("renders a currency menu, a creature menu and the buttons", async () => {
      const paginatePromise = await start();

      const { components } = firstPayload();
      expect(components).toHaveLength(3);
      expect(components[0].components[0].data.placeholder).toBe(
        "Filter by currency",
      );
      expect(components[1].components[0].data.placeholder).toBe(
        "Jump to a creature",
      );
      expect(components[2].components).toHaveLength(5);

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("jumps straight to a creature picked from the menu", async () => {
      const paginatePromise = await start();
      const [, creatureId] = menuIds();

      await collectHandler({
        user: { id: "user-0" },
        customId: creatureId,
        values: ["SEAHORSE"],
        deferUpdate: jest.fn().mockResolvedValue(undefined),
      });

      expect(lastEmbed().data.description).toContain("Seahorse");

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("moves to the chosen currency's first creature", async () => {
      const paginatePromise = await start();
      const [currencyId] = menuIds();

      await collectHandler({
        user: { id: "user-0" },
        customId: currencyId,
        values: ["BAN"],
        deferUpdate: jest.fn().mockResolvedValue(undefined),
      });

      expect(lastEmbed().data.description).toContain("Seahorse");

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("keeps wrapping inside the chosen currency", async () => {
      const paginatePromise = await start("XNO");

      const buttons = firstPayload().components.at(-1).components;
      const wrapRightId = buttons.at(-1).data.custom_id;

      // Two Nano creatures, so wrapping twice returns to the first rather than
      // wandering into Banano.
      await collectHandler({
        user: { id: "user-0" },
        customId: wrapRightId,
        deferUpdate: jest.fn().mockResolvedValue(undefined),
      });
      expect(lastEmbed().data.description).toContain("Kraken");

      mockClient.buttonCooldowns.clear();
      await collectHandler({
        user: { id: "user-0" },
        customId: wrapRightId,
        deferUpdate: jest.fn().mockResolvedValue(undefined),
      });
      expect(lastEmbed().data.description).toContain("Shrimp");

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("hides the currency menu when only one currency has a board", async () => {
      const paginatePromise = paginateLeaderboard(
        mockInteraction,
        mockClient,
        "Fishing Leaderboard",
        { SHRIMP: category("Shrimp", "XNO", 3) },
        mockCommands,
        "user-0",
        currencies,
      );
      await Promise.resolve();

      // One currency and one creature leaves nothing to choose between.
      expect(firstPayload().components).toHaveLength(1);

      endHandler?.({ size: 0 });
      await paginatePromise;
    });

    it("disables the wrap arrows when the scope holds one creature", async () => {
      const paginatePromise = await start("BAN");

      const buttons = firstPayload().components.at(-1).components;
      expect(buttons[0].data.disabled).toBe(true);
      expect(buttons.at(-1).data.disabled).toBe(true);

      endHandler?.({ size: 0 });
      await paginatePromise;
    });
  });
});
