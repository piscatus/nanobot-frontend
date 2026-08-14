const { apiRequest } = require("../utils/apiRequest.js");
const receive = require("./receive.js");

jest.mock("../utils/apiRequest.js");

describe("requests/receive", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/receive and body", async () => {
    const mockResponse = {
      data: { addresses: [], currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await receive.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/receive", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("addresses");
    expect(result.data).toHaveProperty("currencies");
  });
});
