const { checkStatuses } = require("./statusUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

describe("statusUtil", () => {
  let mockInteraction;

  beforeEach(() => {
    mockInteraction = {
      user: { id: "user-123" },
      editReply: jest.fn().mockResolvedValue(undefined),
    };
    process.env.BOT_OWNER_USER_ID = "owner-123";
  });

  describe("checkStatuses", () => {
    it("returns false when response is null", async () => {
      const result = await checkStatuses(
        mockInteraction,
        null,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(false);
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it("returns false when response status does not match expected", async () => {
      const response = { status: 500, data: {} };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(false);
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it("returns false when response has errorMessage", async () => {
      const response = {
        status: 200,
        data: { errorMessage: "Something went wrong" },
      };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(false);
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it("returns true when status matches and no errors for non-owner", async () => {
      const response = {
        status: 200,
        data: {
          commands: [{ name: COMMAND_KEYS.FISH, status: "ACTIVE" }],
          guildConfigurations: { status: "ACTIVE" },
          userDetails: { status: "ACTIVE" },
        },
      };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(true);
      expect(mockInteraction.editReply).not.toHaveBeenCalled();
    });

    it("returns true for bot owner even when command is disabled", async () => {
      process.env.BOT_OWNER_USER_ID = "user-123";
      const response = {
        status: 200,
        data: {
          commands: [{ name: COMMAND_KEYS.FISH, status: "DISABLED" }],
          guildConfigurations: { status: "ACTIVE" },
          userDetails: { status: "ACTIVE" },
        },
      };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(true);
    });

    it("returns false for non-owner when command is disabled", async () => {
      const response = {
        status: 200,
        data: {
          commands: [{ name: COMMAND_KEYS.FISH, status: "DISABLED" }],
          guildConfigurations: { status: "ACTIVE" },
          userDetails: { status: "ACTIVE" },
        },
      };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(false);
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it("returns false for non-owner when guild is inactive", async () => {
      const response = {
        status: 200,
        data: {
          commands: [{ name: COMMAND_KEYS.FISH, status: "ACTIVE" }],
          guildConfigurations: { status: "DISABLED" },
          userDetails: { status: "ACTIVE" },
        },
      };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(false);
    });

    it("returns false for non-owner when user is inactive", async () => {
      const response = {
        status: 200,
        data: {
          commands: [{ name: COMMAND_KEYS.FISH, status: "ACTIVE" }],
          guildConfigurations: { status: "ACTIVE" },
          userDetails: { status: "DISABLED" },
        },
      };
      const result = await checkStatuses(
        mockInteraction,
        response,
        200,
        COMMAND_KEYS.FISH
      );
      expect(result).toBe(false);
    });
  });
});
