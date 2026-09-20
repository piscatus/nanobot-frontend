const { apiRequest } = require("../utils/apiRequest.js");
const trivias = require("./trivias.js");

jest.mock("../utils/apiRequest.js");

describe("requests/trivias", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with GET /trivias/categories", async () => {
    const mockResponse = {
      data: ["Science", "History"],
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await trivias.getCategories();

    expect(apiRequest).toHaveBeenCalledWith("get", "/trivias/categories");
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toEqual(["Science", "History"]);
  });
});
