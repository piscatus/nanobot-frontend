const { apiRequest } = require("../utils/apiRequest.js");
const update = require("./update.js");

jest.mock("../utils/apiRequest.js");

describe("requests/update", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/update and body", async () => {
    const mockResponse = {
      data: { currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await update.execute("321", "231", true, "ban_123");

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/update", {
      address: "ban_123",
      confirmation: true,
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
