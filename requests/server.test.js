const { apiRequest } = require("../utils/apiRequest.js");
const server = require("./server.js");

jest.mock("../utils/apiRequest.js");

describe("requests/server", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/server and body", async () => {
    const mockResponse = {
      data: { currencies: [], guildWallets: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await server.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/server", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("guildWallets");
  });
});
