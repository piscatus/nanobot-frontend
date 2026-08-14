const { apiRequest } = require("../utils/apiRequest.js");
const reserves = require("./reserves.js");

jest.mock("../utils/apiRequest.js");

describe("requests/reserves", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/reserves and body", async () => {
    const mockResponse = {
      data: { currencies: [], guildWallets: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await reserves.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/reserves", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("guildWallets");
  });
});
