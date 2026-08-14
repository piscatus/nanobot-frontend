const { apiRequest } = require("../utils/apiRequest.js");
const audit = require("./audit.js");

jest.mock("../utils/apiRequest.js");

describe("requests/audit", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/audit and body", async () => {
    const mockResponse = {
      data: {
        bonuses: [],
        currencies: [],
        creatures: [],
        drops: [],
        guildsWallets: [],
        usersItems: [],
        usersWallets: [],
      },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await audit.execute("321", "123");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/audit", {
      guildId: "321",
      userId: "123",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("currencies");
  });
});
