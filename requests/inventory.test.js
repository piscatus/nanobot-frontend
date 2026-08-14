const { apiRequest } = require("../utils/apiRequest.js");
const inventory = require("./inventory.js");

jest.mock("../utils/apiRequest.js");

describe("requests/inventory", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/inventory and body", async () => {
    const mockResponse = {
      data: {
        bonuses: [],
        userItems: [],
        subordinateItems: [],
        currencies: [],
        creatures: [],
      },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await inventory.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/inventory", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("userItems");
    expect(result.data).toHaveProperty("currencies");
  });
});
