const { apiRequest } = require("../utils/apiRequest.js");
const wallet = require("./wallet.js");

jest.mock("../utils/apiRequest.js");

describe("requests/wallet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/wallet and body", async () => {
    const mockResponse = {
      data: {
        userWallets: [],
        subordinateWallets: [],
        currencies: [],
      },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await wallet.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/wallet", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("userWallets");
    expect(result.data).toHaveProperty("currencies");
  });
});
