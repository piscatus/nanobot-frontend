const { apiRequest } = require("../utils/apiRequest.js");
const sell = require("./sell.js");

jest.mock("../utils/apiRequest.js");

describe("requests/sell", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/sell and body", async () => {
    const mockResponse = {
      data: { currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await sell.execute("321", "231", false, "10 fish");

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/sell", {
      confirmation: false,
      guildId: "321",
      input: "10 fish",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
