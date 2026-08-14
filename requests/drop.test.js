const { apiRequest } = require("../utils/apiRequest.js");
const drop = require("./drop.js");

jest.mock("../utils/apiRequest.js");

describe("requests/drop", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/drop and body", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [], drop: null },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await drop.execute(
      "231",
      "123",
      "213",
      30,
      "222",
      10,
      1,
      false,
      "10 Kraken",
    );

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/drop", {
      channelId: "123",
      confirmation: false,
      duration: 30,
      guildId: "231",
      input: "10 Kraken",
      random: 1,
      roleId: "222",
      userId: "213",
      users: 10,
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("currencies");
  });
});
