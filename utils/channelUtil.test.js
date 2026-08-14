const channelUtil = require("./channelUtil.js");
const { buildEmbed } = require("./embedUtil.js");

describe("channelUtil", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      channels: {
        cache: {
          get: jest.fn(),
        },
      },
    };
  });

  describe("deleteMessage", () => {
    it("returns undefined when channel not found", async () => {
      mockClient.channels.cache.get.mockReturnValue(undefined);

      const result = await channelUtil.deleteMessage(
        mockClient,
        "fish",
        "channel-123",
        "msg-456"
      );

      expect(result).toBeUndefined();
      expect(mockClient.channels.cache.get).toHaveBeenCalledWith("channel-123");
    });

    it("returns undefined when message not found", async () => {
      const mockChannel = {
        messages: { fetch: jest.fn().mockResolvedValue(null) },
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const result = await channelUtil.deleteMessage(
        mockClient,
        "fish",
        "channel-123",
        "msg-456"
      );

      expect(result).toBeUndefined();
      expect(mockChannel.messages.fetch).toHaveBeenCalledWith("msg-456");
    });

    it("returns delete result when channel and message exist", async () => {
      const mockMessage = { delete: jest.fn().mockResolvedValue({ id: "msg-456" }) };
      const mockChannel = {
        messages: { fetch: jest.fn().mockResolvedValue(mockMessage) },
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const result = await channelUtil.deleteMessage(
        mockClient,
        "fish",
        "channel-123",
        "msg-456"
      );

      expect(result).toEqual({ id: "msg-456" });
      expect(mockMessage.delete).toHaveBeenCalled();
    });
  });

  describe("editEmbed", () => {
    it("returns null when channel not found", async () => {
      mockClient.channels.cache.get.mockReturnValue(undefined);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.editEmbed(
        mockClient,
        "fish",
        "channel-123",
        embed,
        [],
        "msg-456"
      );

      expect(result).toBeNull();
    });

    it("returns null when message not found", async () => {
      const mockChannel = {
        messages: { fetch: jest.fn().mockResolvedValue(null) },
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.editEmbed(
        mockClient,
        "fish",
        "channel-123",
        embed,
        [],
        "msg-456"
      );

      expect(result).toBeNull();
    });

    it("returns edit result when channel and message exist", async () => {
      const mockMessage = {
        edit: jest.fn().mockResolvedValue({ id: "msg-456" }),
      };
      const mockChannel = {
        messages: { fetch: jest.fn().mockResolvedValue(mockMessage) },
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.editEmbed(
        mockClient,
        "fish",
        "channel-123",
        embed,
        [],
        "msg-456"
      );

      expect(result).toEqual({ id: "msg-456" });
      expect(mockMessage.edit).toHaveBeenCalledWith({
        embeds: [embed],
        components: [],
      });
    });
  });

  describe("send", () => {
    it("returns null when channel not found", async () => {
      mockClient.channels.cache.get.mockReturnValue(undefined);

      const result = await channelUtil.send(
        mockClient,
        "fish",
        "channel-123",
        "Hello"
      );

      expect(result).toBeNull();
    });

    it("returns send result when channel exists", async () => {
      const mockResponse = { id: "new-msg" };
      const mockChannel = {
        send: jest.fn().mockResolvedValue(mockResponse),
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const result = await channelUtil.send(
        mockClient,
        "fish",
        "channel-123",
        "Hello"
      );

      expect(result).toEqual(mockResponse);
      expect(mockChannel.send).toHaveBeenCalledWith({
        content: "Hello",
        allowedMentions: { parse: ["users"], roles: [] },
      });
    });
  });

  describe("sendWithFile", () => {
    it("returns null when channel not found", async () => {
      mockClient.channels.cache.get.mockReturnValue(undefined);

      const result = await channelUtil.sendWithFile(
        mockClient,
        "fish",
        "channel-123",
        "Content",
        [{ attachment: "file.png" }]
      );

      expect(result).toBeNull();
    });

    it("returns send result when channel exists", async () => {
      const mockResponse = { id: "new-msg" };
      const mockChannel = {
        send: jest.fn().mockResolvedValue(mockResponse),
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const file = [{ attachment: "file.png" }];
      const result = await channelUtil.sendWithFile(
        mockClient,
        "fish",
        "channel-123",
        "Content",
        file
      );

      expect(result).toEqual(mockResponse);
      expect(mockChannel.send).toHaveBeenCalledWith({
        content: "Content",
        files: file,
      });
    });
  });

  describe("sendWithEmbed", () => {
    it("returns null when channel not found", async () => {
      mockClient.channels.cache.get.mockReturnValue(undefined);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.sendWithEmbed(
        mockClient,
        "fish",
        "channel-123",
        "Content",
        embed
      );

      expect(result).toBeNull();
    });

    it("returns send result when channel exists", async () => {
      const mockResponse = { id: "new-msg" };
      const mockChannel = {
        send: jest.fn().mockResolvedValue(mockResponse),
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.sendWithEmbed(
        mockClient,
        "fish",
        "channel-123",
        "Content",
        embed
      );

      expect(result).toEqual(mockResponse);
      expect(mockChannel.send).toHaveBeenCalledWith({
        content: "Content",
        embeds: [embed],
      });
    });
  });

  describe("sendEmbed", () => {
    it("returns null when channel not found", async () => {
      mockClient.channels.cache.get.mockReturnValue(undefined);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.sendEmbed(
        mockClient,
        "fish",
        "channel-123",
        embed,
        []
      );

      expect(result).toBeNull();
    });

    it("returns send result when channel exists", async () => {
      const mockResponse = { id: "new-msg" };
      const mockChannel = {
        send: jest.fn().mockResolvedValue(mockResponse),
      };
      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      const embed = buildEmbed({ title: "Test" });
      const result = await channelUtil.sendEmbed(
        mockClient,
        "fish",
        "channel-123",
        embed,
        []
      );

      expect(result).toEqual(mockResponse);
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [embed],
        components: [],
      });
    });
  });
});
