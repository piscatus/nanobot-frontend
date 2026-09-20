const triviasApi = require("../requests/trivias.js");
const refreshTriviaCategories = require("./refreshTriviaCategories.js");

jest.mock("../requests/trivias.js");

describe("jobs/refreshTriviaCategories", () => {
  beforeEach(() => jest.clearAllMocks());

  it("replaces triviaCategories when data is an array and returns true", async () => {
    triviasApi.getCategories.mockResolvedValue({
      data: ["Science", "History"],
    });
    const client = { commandContext: { triviaCategories: ["Old"] } };

    const result = await refreshTriviaCategories.execute(client);

    expect(result).toBe(true);
    expect(client.commandContext.triviaCategories).toEqual([
      "Science",
      "History",
    ]);
  });

  it("creates commandContext when it is missing", async () => {
    triviasApi.getCategories.mockResolvedValue({
      data: ["Science"],
    });
    const client = {};

    const result = await refreshTriviaCategories.execute(client);

    expect(result).toBe(true);
    expect(client.commandContext).toEqual({
      triviaCategories: ["Science"],
    });
  });

  it("leaves the previous list untouched and returns false when the response is null", async () => {
    triviasApi.getCategories.mockResolvedValue(null);
    const previous = ["Science"];
    const client = { commandContext: { triviaCategories: previous } };

    const result = await refreshTriviaCategories.execute(client);

    expect(result).toBe(false);
    expect(client.commandContext.triviaCategories).toBe(previous);
    expect(client.commandContext.triviaCategories).toEqual(["Science"]);
  });

  it("leaves the previous list untouched and returns false when data is not an array", async () => {
    triviasApi.getCategories.mockResolvedValue({ data: { error: true } });
    const previous = ["Science"];
    const client = { commandContext: { triviaCategories: previous } };

    const result = await refreshTriviaCategories.execute(client);

    expect(result).toBe(false);
    expect(client.commandContext.triviaCategories).toBe(previous);
    expect(client.commandContext.triviaCategories).toEqual(["Science"]);
  });
});
