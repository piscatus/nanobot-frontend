const { paginateLeaderboard } = require("./leaderboardUtil.js");
const { COMMAND_KEYS, EMOJIS } = require("./constants.js");

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
});
