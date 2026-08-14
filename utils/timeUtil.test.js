const { formatTime } = require("./timeUtil.js");

describe("timeUtil", () => {
  describe("formatTime", () => {
    it("formats minutes under an hour", () => {
      expect(formatTime(0)).toBe("0 minutes");
      expect(formatTime(1)).toBe("1 minute");
      expect(formatTime(30)).toBe("30 minutes");
      expect(formatTime(59)).toBe("59 minutes");
    });

    it("formats hours and minutes", () => {
      expect(formatTime(60)).toBe("1 hour");
      expect(formatTime(90)).toBe("1 hour and 30 minutes");
      expect(formatTime(120)).toBe("2 hours");
    });

    it("formats days, hours, and minutes", () => {
      expect(formatTime(1440)).toBe("1 day");
      expect(formatTime(1500)).toBe("1 day and 1 hour");
      expect(formatTime(1530)).toBe("1 day, 1 hour, and 30 minutes");
    });

    it("formats multiple days", () => {
      expect(formatTime(2880)).toBe("2 days");
      expect(formatTime(4320)).toBe("3 days");
    });

    it("formats complex combinations", () => {
      expect(formatTime(90)).toBe("1 hour and 30 minutes");
      expect(formatTime(150)).toBe("2 hours and 30 minutes");
      expect(formatTime(1440 + 90)).toBe("1 day, 1 hour, and 30 minutes");
    });

    it("formats 1 hour and 1 minute", () => {
      expect(formatTime(61)).toBe("1 hour and 1 minute");
    });

    it("formats 2 days and 30 minutes", () => {
      expect(formatTime(2910)).toBe("2 days and 30 minutes");
    });
  });
});
