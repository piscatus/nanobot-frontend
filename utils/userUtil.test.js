const { sendDMEmbed } = require("./userUtil.js");
const { buildEmbed } = require("./embedUtil.js");

describe("userUtil", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      users: {
        fetch: jest.fn(),
      },
    };
  });

  describe("sendDMEmbed", () => {
    it("returns null when user not found", async () => {
      mockClient.users.fetch.mockResolvedValue(null);

      const embed = buildEmbed({ title: "Test" });
      const result = await sendDMEmbed(
        mockClient,
        "fish",
        "user-123",
        embed
      );

      expect(result).toBeNull();
      expect(mockClient.users.fetch).toHaveBeenCalledWith("user-123");
    });

    it("returns null when fetch throws", async () => {
      mockClient.users.fetch.mockRejectedValue(new Error("User not found"));

      const embed = buildEmbed({ title: "Test" });
      const result = await sendDMEmbed(
        mockClient,
        "fish",
        "user-123",
        embed
      );

      expect(result).toBeUndefined();
    });

    it("returns send result when user exists and DM is sent", async () => {
      const mockMessage = { id: "dm-msg-123" };
      const mockDmChannel = {
        send: jest.fn().mockResolvedValue(mockMessage),
      };
      const mockUser = {
        createDM: jest.fn().mockResolvedValue(mockDmChannel),
      };
      mockClient.users.fetch.mockResolvedValue(mockUser);

      const embed = buildEmbed({ title: "Test" });
      const result = await sendDMEmbed(
        mockClient,
        "fish",
        "user-123",
        embed
      );

      expect(result).toEqual(mockMessage);
      expect(mockUser.createDM).toHaveBeenCalled();
      expect(mockDmChannel.send).toHaveBeenCalledWith({
        embeds: [embed],
      });
    });
  });
});
