const axios = require("axios");
const verifications = require("./verifications.js");

jest.mock("axios");

describe("requests/verifications", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NANOBOT_API_URL: "https://api.example.com" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("check", () => {
    it("calls GET /verifications/userId/:userId/check - 200 returns verified", async () => {
      axios.get.mockResolvedValue({ status: 200, data: {} });

      const result = await verifications.check("user123");

      expect(axios.get).toHaveBeenCalledWith(
        "https://api.example.com/verifications/userId/user123/check",
        expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
      );
      expect(result.status).toBe(200);
    });

    it("401 returns need puzzle with emojis in body", async () => {
      axios.get.mockResolvedValue({ status: 401, data: { emojis: ["a", "b"] } });

      const result = await verifications.check("user123");

      expect(result.status).toBe(401);
      expect(result.data).toEqual({ emojis: ["a", "b"] });
    });
  });

  describe("getByUserId", () => {
    it("calls GET /verifications/userId/:userId", async () => {
      axios.get.mockResolvedValue({ status: 200, data: { id: "v1" } });

      const result = await verifications.getByUserId("user123");

      expect(axios.get).toHaveBeenCalledWith(
        "https://api.example.com/verifications/userId/user123",
        expect.any(Object),
      );
      expect(result.data).toEqual({ id: "v1" });
    });
  });

  describe("create", () => {
    it("calls POST /verifications with userId", async () => {
      axios.post.mockResolvedValue({ status: 201, data: { id: "v1" } });

      const result = await verifications.create("user123");

      expect(axios.post).toHaveBeenCalledWith(
        "https://api.example.com/verifications",
        { userId: "user123" },
        expect.any(Object),
      );
      expect(result.data).toEqual({ id: "v1" });
    });
  });

  describe("update", () => {
    it("calls PUT /verifications/:id with id and userId", async () => {
      axios.put.mockResolvedValue({ status: 200, data: {} });

      const result = await verifications.update("ver-id-1", "user123");

      expect(axios.put).toHaveBeenCalledWith(
        "https://api.example.com/verifications/ver-id-1",
        { id: "ver-id-1", userId: "user123" },
        expect.any(Object),
      );
      expect(result.status).toBe(200);
    });
  });
});
