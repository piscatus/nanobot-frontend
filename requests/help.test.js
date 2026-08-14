const { apiRequest } = require("../utils/apiRequest.js");
const help = require("./help.js");

jest.mock("../utils/apiRequest.js");

describe("requests/help", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/help and body", async () => {
    const mockResponse = {
      data: { currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await help.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/help", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("currencies");
  });
});
