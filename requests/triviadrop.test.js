const { apiRequest } = require("../utils/apiRequest.js");
const triviadrop = require("./triviadrop.js");

jest.mock("../utils/apiRequest.js");

describe("requests/triviadrop", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/triviadrop and body", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [], drop: null },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await triviadrop.execute(
      "231",
      "123",
      "213",
      3,
      2,
      false,
      "1 ban",
      "alice",
      "Science",
      "medium",
      15,
    );

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/triviadrop", {
      category: "Science",
      channelId: "123",
      confirmation: false,
      difficulty: "medium",
      duration: 3,
      guildId: "231",
      input: "1 ban",
      seconds: 15,
      userId: "213",
      username: "alice",
      users: 2,
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("currencies");
  });

  it("includes a null difficulty in the body when none was chosen", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [], drop: null },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    await triviadrop.execute(
      "231",
      "123",
      "213",
      3,
      2,
      false,
      "1 ban",
      "alice",
      "Science",
      null,
      null,
    );

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/triviadrop", {
      category: "Science",
      channelId: "123",
      confirmation: false,
      difficulty: null,
      duration: 3,
      guildId: "231",
      input: "1 ban",
      seconds: null,
      userId: "213",
      username: "alice",
      users: 2,
    });
  });
});
