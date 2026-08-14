const { apiRequest } = require("../utils/apiRequest.js");
const rules = require("./rules.js");

jest.mock("../utils/apiRequest.js");

describe("requests/rules", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/rules and body", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await rules.execute("321", "231");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/rules", {
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
