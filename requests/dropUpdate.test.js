const { apiRequest } = require("../utils/apiRequest.js");
const dropUpdate = require("./dropUpdate.js");

jest.mock("../utils/apiRequest.js");

describe("requests/dropUpdate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with POST /drop/update and body", async () => {
    const mockResponse = {
      data: {},
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await dropUpdate.execute("321", "123", "message");

    expect(apiRequest).toHaveBeenCalledWith("post", "/drop/update", {
      id: "321",
      dropId: "123",
      messageData: "message",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
