const { apiRequest } = require("../utils/apiRequest.js");
const leaderboards = require("./leaderboards.js");

jest.mock("../utils/apiRequest.js");

describe("requests/leaderboards", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/leaderboards and body", async () => {
    const mockResponse = {
      data: { currencies: [], leaderboards: [], creatures: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await leaderboards.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/leaderboards", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("leaderboards");
  });
});
