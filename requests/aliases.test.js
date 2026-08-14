const { apiRequest } = require("../utils/apiRequest.js");
const aliases = require("./aliases.js");

jest.mock("../utils/apiRequest.js");

describe("requests/aliases", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/aliases and body", async () => {
    const mockResponse = {
      data: { aliases: [], currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await aliases.execute("321", "123", true);

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/aliases", {
      guildId: "321",
      global: true,
      userId: "123",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("aliases");
    expect(result.data).toHaveProperty("currencies");
  });
});
