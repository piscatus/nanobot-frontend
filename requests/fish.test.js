const { apiRequest } = require("../utils/apiRequest.js");
const fish = require("./fish.js");

jest.mock("../utils/apiRequest.js");

describe("requests/fish", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/fish and body", async () => {
    const mockResponse = {
      data: { currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await fish.execute("231", "213", ["123", "321", "231"]);

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/fish", {
      guildId: "231",
      userId: "213",
      userRoles: ["123", "321", "231"],
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
