const { buildCriteriaList } = require("./transferUtil.js");
const { EMOJIS } = require("./constants.js");

describe("transferUtil", () => {
  describe("buildCriteriaList", () => {
    it("returns empty array for null drop", () => {
      const result = buildCriteriaList(null, false);
      expect(result).toEqual([]);
    });

    it("includes duration when drop has duration", () => {
      const drop = { duration: 60 };
      const result = buildCriteriaList(drop, false);
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain("Duration");
      expect(result[0].value).toContain("1 hour");
    });

    it("uses Activity Duration label when no endTime", () => {
      const drop = { duration: 30 };
      const result = buildCriteriaList(drop, false);
      expect(result[0].name).toContain("Activity Duration");
    });

    it("uses Drop Duration label when has endTime", () => {
      const drop = { duration: 30, endTime: "2025-01-01T00:00:00Z" };
      const result = buildCriteriaList(drop, false);
      expect(result[0].name).toContain("Drop Duration");
    });

    it("includes drop end timestamp when displayTimestamp is true", () => {
      const drop = {
        duration: 30,
        endTime: "2025-03-15T12:00:00.000Z",
      };
      const result = buildCriteriaList(drop, true);
      const timestampField = result.find((r) => r.name?.includes("Drop Ends"));
      expect(timestampField).toBeDefined();
      expect(timestampField.value).toContain("<t:");
      expect(timestampField.value).toContain(":R>");
    });

    it("includes maximum entries when valid", () => {
      const drop = { duration: 30, maximumEntries: "100" };
      const result = buildCriteriaList(drop, false);
      const maxField = result.find((r) =>
        r.name?.includes("Maximum Entries") || r.name?.includes("Most Recently")
      );
      expect(maxField).toBeDefined();
      expect(maxField.value).toContain("100");
    });

    it("includes number of winners when valid", () => {
      const drop = { duration: 30, numberWinners: 5 };
      const result = buildCriteriaList(drop, false);
      const winnersField = result.find((r) =>
        r.name?.includes("Random Winners")
      );
      expect(winnersField).toBeDefined();
      expect(winnersField.value).toContain("5");
    });

    it("includes required role when present", () => {
      const drop = { duration: 30, requiredRole: "role123" };
      const result = buildCriteriaList(drop, false);
      const roleField = result.find((r) => r.name?.includes("Required Role"));
      expect(roleField).toBeDefined();
      expect(roleField.value).toContain("<@&role123>");
    });

    it("skips maximum entries when length >= 4", () => {
      const drop = { duration: 30, maximumEntries: "10000" };
      const result = buildCriteriaList(drop, false);
      const maxField = result.find((r) => r.name?.includes("Maximum"));
      expect(maxField).toBeUndefined();
    });

    it("skips number winners when zero", () => {
      const drop = { duration: 30, numberWinners: 0 };
      const result = buildCriteriaList(drop, false);
      const winnersField = result.find((r) =>
        r.name?.includes("Random Winners")
      );
      expect(winnersField).toBeUndefined();
    });
  });
});
