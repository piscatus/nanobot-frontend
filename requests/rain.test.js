const { apiRequest } = require("../utils/apiRequest.js");
const rain = require("./rain.js");

jest.mock("../utils/apiRequest.js");

describe("requests/rain", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/rain and body", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await rain.execute(
      "321",
      "123",
      "231",
      false,
      60,
      "1 Nano",
      0,
      ["0"],
      0,
      null,
    );

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/rain", {
      channelId: "123",
      confirmation: false,
      duration: 60,
      guildId: "321",
      input: "1 Nano",
      random: 0,
      userId: "231",
      userIdsWithRole: ["0"],
      users: 0,
      roleId: null,
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
