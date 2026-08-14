const { capitalize, isValidString, sanitizeInput } = require("./stringUtil.js");

describe("stringUtil", () => {
  describe("capitalize", () => {
    it("capitalizes first letter and lowercases the rest", () => {
      expect(capitalize("gift")).toBe("Gift");
      expect(capitalize("GLOBAL")).toBe("Global");
      expect(capitalize("server")).toBe("Server");
    });
  });

  describe("isValidString", () => {
    it("returns true for non-empty strings", () => {
      expect(isValidString("hello")).toBe(true);
      expect(isValidString("1")).toBe(true);
      expect(isValidString(" ")).toBe(true);
    });

    it("returns false for null and undefined", () => {
      expect(isValidString(null)).toBe(false);
      expect(isValidString(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidString("")).toBe(false);
    });

    it("returns false for string '0'", () => {
      expect(isValidString("0")).toBe(false);
    });
  });

  describe("sanitizeInput", () => {
    it("trims whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("collapses multiple spaces", () => {
      expect(sanitizeInput("hello    world")).toBe("hello world");
    });

    it("handles null and undefined", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
    });
  });
});
