const checkMessages = require("./checkMessages.js");
const deleteQueuedMessage = require("./deleteMessage.js");
const channelUtil = require("../utils/channelUtil.js");
const userUtil = require("../utils/userUtil.js");
const sendMessages = require("./sendMessages.js");

jest.mock("./checkMessages.js");
jest.mock("./deleteMessage.js");
jest.mock("../utils/channelUtil.js", () => ({
  editEmbed: jest.fn(),
  sendEmbed: jest.fn(),
}));
jest.mock("../utils/userUtil.js", () => ({
  sendDMEmbed: jest.fn(),
}));

describe("jobs/sendMessages", () => {
  const client = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    deleteQueuedMessage.execute.mockResolvedValue({ status: 204 });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("does nothing when checkMessages returns no data", async () => {
    checkMessages.execute.mockResolvedValue(null);

    await sendMessages.execute(client);

    expect(channelUtil.editEmbed).not.toHaveBeenCalled();
    expect(deleteQueuedMessage.execute).not.toHaveBeenCalled();
  });

  // Delivery is at-most-once: the queue row is removed before the Discord call,
  // so a failing or blank message is logged and dropped rather than retried forever.
  it("removes the queue row, then edits the guild message", async () => {
    checkMessages.execute.mockResolvedValue({
      data: [
        {
          id: "queue-1",
          channelId: "channel-1",
          messageId: "discord-1",
          title: "The drop has ended!",
          content: "Paid out.",
          color: "#757575",
        },
      ],
    });
    channelUtil.editEmbed.mockResolvedValue({ id: "discord-1" });

    await sendMessages.execute(client);

    expect(channelUtil.editEmbed).toHaveBeenCalledTimes(1);
    expect(channelUtil.editEmbed.mock.calls[0][5]).toBe("discord-1");
    expect(channelUtil.editEmbed.mock.calls[0][4]).toEqual([]);
    expect(deleteQueuedMessage.execute).toHaveBeenCalledTimes(1);
    expect(deleteQueuedMessage.execute).toHaveBeenCalledWith("queue-1");
    expect(deleteQueuedMessage.execute.mock.invocationCallOrder[0]).toBeLessThan(
      channelUtil.editEmbed.mock.invocationCallOrder[0],
    );
  });

  it("still removes the queue row when the Discord edit fails (no retry)", async () => {
    checkMessages.execute.mockResolvedValue({
      data: [
        {
          id: "queue-1",
          channelId: "channel-1",
          messageId: "discord-1",
          title: "The drop has ended!",
          content: "Paid out.",
        },
      ],
    });
    channelUtil.editEmbed.mockResolvedValue(null);

    await sendMessages.execute(client);

    expect(channelUtil.editEmbed).toHaveBeenCalled();
    expect(deleteQueuedMessage.execute).toHaveBeenCalledWith("queue-1");
  });

  it("does not edit Discord when the embed has no visible content, and drops the queue row", async () => {
    checkMessages.execute.mockResolvedValue({
      data: [
        {
          id: "queue-empty",
          channelId: "channel-1",
          messageId: "discord-1",
          color: "#757575",
        },
      ],
    });

    await sendMessages.execute(client);

    expect(channelUtil.editEmbed).not.toHaveBeenCalled();
    expect(channelUtil.sendEmbed).not.toHaveBeenCalled();
    expect(userUtil.sendDMEmbed).not.toHaveBeenCalled();
    expect(deleteQueuedMessage.execute).toHaveBeenCalledWith("queue-empty");
  });

  it("sends a DM then deletes the queue row", async () => {
    checkMessages.execute.mockResolvedValue({
      data: [
        {
          id: "queue-dm",
          userId: "123456789012345678",
          title: "Deposit Confirmed",
          content: "Your deposit arrived.",
        },
      ],
    });
    userUtil.sendDMEmbed.mockResolvedValue({ id: "dm-1" });

    await sendMessages.execute(client);

    expect(userUtil.sendDMEmbed).toHaveBeenCalled();
    expect(deleteQueuedMessage.execute).toHaveBeenCalledWith("queue-dm");
  });

  it("sends a new guild message then deletes the queue row", async () => {
    checkMessages.execute.mockResolvedValue({
      data: [
        {
          id: "queue-send",
          channelId: "channel-1",
          title: "Notice",
          content: "Hello",
        },
      ],
    });
    channelUtil.sendEmbed.mockResolvedValue({ id: "new-1" });

    await sendMessages.execute(client);

    expect(channelUtil.sendEmbed).toHaveBeenCalled();
    expect(channelUtil.editEmbed).not.toHaveBeenCalled();
    expect(deleteQueuedMessage.execute).toHaveBeenCalledWith("queue-send");
  });
});
