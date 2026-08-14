const { apiRequest } = require("../utils/apiRequest.js");
const creatures = require("./creatures.js");

jest.mock("../utils/apiRequest.js");

describe("requests/creatures", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/creatures and body", async () => {
    const mockResponse = {
      data: { bonuses: [], currencies: [], creatures: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await creatures.execute("321", "213");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/creatures", {
      guildId: "321",
      userId: "213",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("creatures");
  });
});
