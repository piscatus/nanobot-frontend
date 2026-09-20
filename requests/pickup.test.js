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

  it("includes answerIndex when provided", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await pickup.execute("123", "231", ["123", "321"], 2);

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/pickup", {
      dropId: "123",
      userId: "231",
      userRoles: ["123", "321"],
      answerIndex: 2,
    });
    expect(result).toEqual(mockResponse);
  });

  it("includes answerIndex 0 because it is a valid button index", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    await pickup.execute("123", "231", ["123"], 0);

    expect(apiRequest).toHaveBeenCalledWith("post", "/requests/pickup", {
      dropId: "123",
      userId: "231",
      userRoles: ["123"],
      answerIndex: 0,
    });
  });
});
