const { apiRequest } = require("../utils/apiRequest.js");
const cute = require("./cute.js");

jest.mock("../utils/apiRequest.js");

describe("requests/cute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/cute and body", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await cute.execute("321", "213");

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/cute", {
      guildId: "321",
      userId: "213",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
