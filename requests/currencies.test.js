const { apiRequest } = require("../utils/apiRequest.js");
const currencies = require("./currencies.js");

jest.mock("../utils/apiRequest.js");

describe("requests/currencies", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/currencies and body", async () => {
    const mockResponse = {
      data: { currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await currencies.execute("321", "213");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/currencies", {
      guildId: "321",
      userId: "213",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("currencies");
  });
});
