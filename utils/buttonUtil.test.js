const { confirm, swap } = require("./buttonUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const { BUTTON_DESCRIPTIONS } = require("./constants.js");

jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-uuid-12345"),
}));

describe("buttonUtil", () => {
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
      stop: jest.fn(),
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

  describe("confirm", () => {
    it("returns true when user confirms", async () => {
      const embed = buildEmbed({ title: "Confirm?", description: "Yes or no" });
      const confirmPromise = confirm(mockInteraction, "fish", embed);

      await Promise.resolve();

      const mockCollectEvent = {
        customId: "fixed-uuid-12345",
        user: { id: "user-123" },
      };
      collectHandler(mockCollectEvent);

      const result = await confirmPromise;
      expect(result).toBe(true);
    });

    it("returns false when user cancels", async () => {
      const { v4: uuidv4 } = require("uuid");
      uuidv4.mockReturnValueOnce("confirm-id").mockReturnValueOnce("cancel-id");

      const embed = buildEmbed({ title: "Confirm?", description: "Yes or no" });
      const confirmPromise = confirm(mockInteraction, "fish", embed);

      await Promise.resolve();

      collectHandler({
        customId: "cancel-id",
        user: { id: "user-123" },
      });

      const result = await confirmPromise;
      expect(result).toBe(false);
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          ephemeral: true,
          embeds: expect.any(Array),
          components: [],
        })
      );
    });

    it("uses a custom confirm label when provided", async () => {
      const embed = buildEmbed({ title: "Confirm?", description: "Wait?" });
      const confirmPromise = confirm(mockInteraction, "withdraw", embed, {
        confirmLabel: BUTTON_DESCRIPTIONS.SEND_WHEN_READY,
      });

      await Promise.resolve();

      const firstReply = mockInteraction.editReply.mock.calls[0][0];
      const labels = JSON.stringify(firstReply.components);
      expect(labels).toContain("Send as soon as possible");
      expect(labels).toContain("Cancel");

      collectHandler({
        customId: "fixed-uuid-12345",
        user: { id: "user-123" },
      });
      await confirmPromise;
    });

    it("returns false when collector ends without collection", async () => {
      const embed = buildEmbed({ title: "Confirm?", description: "Yes or no" });
      const confirmPromise = confirm(mockInteraction, "fish", embed);

      await Promise.resolve();

      endHandler({ size: 0 });

      const result = await confirmPromise;
      expect(result).toBe(false);
    });

    it("returns false and logs on error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockInteraction.editReply.mockRejectedValueOnce(new Error("Network error"));

      const embed = buildEmbed({ title: "Confirm?" });
      const result = await confirm(mockInteraction, "fish", embed);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("swap", () => {
    it("calls editReply with initial embed and components", async () => {
      const swapPromise = swap(
        mockInteraction,
        mockClient,
        "#0000ff",
        "#ff0000",
        "Home",
        "Home text",
        "Home content",
        [],
        "Sub",
        "Sub text",
        "Sub content",
        []
      );

      await Promise.resolve();

      endHandler({ size: 0 });

      await swapPromise;

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Home text",
          embeds: expect.any(Array),
          components: expect.any(Array),
          fetchReply: true,
        })
      );
    });
  });
});
