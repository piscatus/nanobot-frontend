const { apiRequest } = require("../utils/apiRequest.js");
const bonuses = require("./bonuses.js");

jest.mock("../utils/apiRequest.js");

describe("requests/bonuses", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/bonuses and body", async () => {
    const mockResponse = {
      data: { bonuses: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await bonuses.execute("321", "123");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/bonuses", {
      guildId: "321",
      userId: "123",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("bonuses");
  });
});
