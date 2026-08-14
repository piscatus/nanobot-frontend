const { apiRequest } = require("../utils/apiRequest.js");
const gift = require("./gift.js");

jest.mock("../utils/apiRequest.js");

describe("requests/gift", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/gift and body", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await gift.execute(
      "321",
      "123",
      "123",
      ["0"],
      false,
      "1 Banano",
    );

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/gift", {
      channelId: "123",
      confirmation: false,
      guildId: "321",
      input: "1 Banano",
      receiverIds: ["0"],
      userId: "123",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
