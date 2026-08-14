const { apiRequest } = require("../utils/apiRequest.js");
const transactions = require("./transactions.js");

jest.mock("../utils/apiRequest.js");

describe("requests/transactions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/transactions and body", async () => {
    const mockResponse = {
      data: { transactions: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await transactions.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/transactions", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("transactions");
  });
});
