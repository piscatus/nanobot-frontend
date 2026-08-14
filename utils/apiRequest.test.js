const axios = require("axios");
const { apiRequest } = require("./apiRequest.js");

jest.mock("axios");

describe("apiRequest", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NANOBOT_API_URL: "https://api.example.com" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("makes GET request with correct URL", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });

    const result = await apiRequest("get", "/wallet");

    expect(axios.get).toHaveBeenCalledWith(
      "https://api.example.com/wallet",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
    expect(result).toEqual({ data: { ok: true } });
  });

  it("makes POST request with body", async () => {
    axios.post.mockResolvedValue({ data: { id: "123" } });

    const result = await apiRequest("post", "/transfer", { amount: 100 });

    expect(axios.post).toHaveBeenCalledWith(
      "https://api.example.com/transfer",
      { amount: 100 },
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
    expect(result).toEqual({ data: { id: "123" } });
  });

  it("uses empty object for body when null for non-GET", async () => {
    axios.post.mockResolvedValue({ data: {} });

    await apiRequest("post", "/path", null);

    expect(axios.post).toHaveBeenCalledWith(
      "https://api.example.com/path",
      {},
      expect.any(Object),
    );
  });

  it("returns null on error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    axios.get.mockRejectedValue(new Error("Network error"));

    const result = await apiRequest("get", "/wallet");

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});
