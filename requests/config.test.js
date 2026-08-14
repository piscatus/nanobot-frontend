const { apiRequest } = require("../utils/apiRequest.js");
const config = require("./config.js");

jest.mock("../utils/apiRequest.js");

describe("requests/config", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/config and guildConfigurations", async () => {
    const guildConfigurations = {
      guildId: "321",
      userId: "123",
      status: "ACTIVE",
    };
    const mockResponse = {
      data: { currencies: [] },
      status: 202,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await config.execute(guildConfigurations);

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/config", guildConfigurations);
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(202);
    expect(result.data).toHaveProperty("currencies");
  });
});
