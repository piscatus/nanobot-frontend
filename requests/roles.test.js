const { apiRequest } = require("../utils/apiRequest.js");
const roles = require("./roles.js");

jest.mock("../utils/apiRequest.js");

describe("requests/roles", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/roles and body", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await roles.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/roles", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
