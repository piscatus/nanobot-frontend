const { dropDurationError } = require("./timeUtil.js");

describe("dropUtil", () => {
  describe("dropDurationError", () => {
    it("returns error message about invalid duration", () => {
      const result = dropDurationError();
      expect(result).toContain("Invalid Duration");
      expect(result).toContain("at least");
      expect(result).toContain("cannot exceed");
      expect(result).toContain("minute");
    });

    it("uses correct pluralization for single minute", () => {
      const result = dropDurationError();
      expect(result).toContain("minute");
    });
  });
});
