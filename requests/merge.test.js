const { apiRequest } = require("../utils/apiRequest.js");
const merge = require("./merge.js");

jest.mock("../utils/apiRequest.js");

describe("requests/merge", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/merge and body", async () => {
    const mockResponse = {
      data: { currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await merge.execute("321", "231", true);

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/merge", {
      confirmation: true,
      guildId: "321",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
