const { apiRequest } = require("../utils/apiRequest.js");
const pickup = require("./pickup.js");

jest.mock("../utils/apiRequest.js");

describe("requests/pickup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /requests/pickup and body", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await pickup.execute("123", "231", ["123", "321", "231"]);

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/pickup", {
      dropId: "123",
      userId: "231",
      userRoles: ["123", "321", "231"],
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
