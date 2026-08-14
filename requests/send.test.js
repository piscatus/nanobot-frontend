const { apiRequest } = require("../utils/apiRequest.js");
const send = require("./send.js");

jest.mock("../utils/apiRequest.js");

describe("requests/send", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls apiRequest with PUT /requests/send and body", async () => {
    const mockResponse = {
      data: { activities: [], currencies: [] },
      status: 200,
    };
    apiRequest.mockResolvedValue(mockResponse);

    const result = await send.execute(
      "321",
      "231",
      true,
      "2.5 BAN",
      "ban_123",
    );

    expect(apiRequest).toHaveBeenCalledWith("put", "/requests/send", {
      address: "ban_123",
      confirmation: true,
      guildId: "321",
      input: "2.5 BAN",
      userId: "231",
    });
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });
});
