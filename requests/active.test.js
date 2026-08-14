const { apiRequest } = require("../utils/apiRequest.js");
const active = require("./active.js");

jest.mock("../utils/apiRequest.js");

describe("requests/active", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/active and body", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await active.execute(
      "321",
      "123",
      "231",
      60,
      0,
      0,
      ["0"],
    );

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/active", {
      channelId: "123",
      duration: 60,
      guildId: "321",
      random: 0,
      userId: "231",
      userIdsWithRole: ["0"],
      users: 0,
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("activities");
  });
});
