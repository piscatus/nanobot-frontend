const {
  activityDurationError,
  durationSpecified,
  combineDurations,
  formatActivities,
  formatDefaultActivityMessage,
} = require("./activitiesUtil.js");
const { COMMAND_KEYS, COMMAND_OPTION_KEYS } = require("./constants.js");

describe("activitiesUtil", () => {
  describe("activityDurationError", () => {
    it("returns error message with correct pluralization for single values", () => {
      const result = activityDurationError();
      expect(result).toContain("at least");
      expect(result).toContain("cannot exceed");
      expect(result).toContain("minute");
    });
  });

  describe("durationSpecified", () => {
    it("returns true when days is specified", () => {
      expect(durationSpecified(1, null, null)).toBe(true);
    });

    it("returns true when hours is specified", () => {
      expect(durationSpecified(null, 1, null)).toBe(true);
    });

    it("returns true when minutes is specified", () => {
      expect(durationSpecified(null, null, 1)).toBe(true);
    });

    it("returns false when all are null", () => {
      expect(durationSpecified(null, null, null)).toBe(false);
    });

    it("returns true when multiple are specified", () => {
      expect(durationSpecified(1, 2, 3)).toBe(true);
    });
  });

  describe("combineDurations", () => {
    it("returns minutes only when only minutes provided", () => {
      expect(combineDurations(null, null, 30)).toBe(30);
    });

    it("converts hours to minutes", () => {
      expect(combineDurations(null, 1, null)).toBe(60);
    });

    it("converts days to minutes", () => {
      expect(combineDurations(1, null, null)).toBe(1440);
    });

    it("combines all duration components", () => {
      expect(combineDurations(1, 1, 30)).toBe(1440 + 60 + 30);
    });

    it("treats null/undefined as 0", () => {
      expect(combineDurations(0, 0, 0)).toBe(0);
    });
  });

  describe("formatActivities", () => {
    const mockCommands = [
      { name: COMMAND_KEYS.RAIN, commandId: "rain123" },
      { name: COMMAND_KEYS.CONFIG, commandId: "config456" },
    ];

    it("returns message with no users when usersDatabase is empty", () => {
      const result = formatActivities(
        [],
        30,
        40,
        0,
        0,
        0,
        null,
        "channel123",
        mockCommands,
        "Config note",
      );
      expect(result).toContain("no users active");
      expect(result).toContain("channel123");
    });

    it("returns message with single user", () => {
      const result = formatActivities(
        [{ userId: "user1" }],
        30,
        40,
        0,
        0,
        0,
        null,
        "channel123",
        mockCommands,
        "Config note",
      );
      expect(result).toContain("***1*** user active");
      expect(result).toContain("<@user1>");
    });

    it("returns message with multiple users", () => {
      const result = formatActivities(
        [{ userId: "user1" }, { userId: "user2" }],
        30,
        40,
        0,
        0,
        0,
        null,
        "channel123",
        mockCommands,
        "Config note",
      );
      expect(result).toContain("***2*** users active");
      expect(result).toContain("<@user1>");
      expect(result).toContain("<@user2>");
    });
  });

  describe("formatDefaultActivityMessage", () => {
    it("includes config command references", () => {
      const commands = [
        { name: COMMAND_KEYS.CONFIG, commandId: "config123" },
      ];
      const result = formatDefaultActivityMessage(commands);
      expect(result).toContain("</config");
      expect(result).toContain(COMMAND_OPTION_KEYS.ACTIVITY_DURATION);
      expect(result).toContain(COMMAND_OPTION_KEYS.USERS_ACTIVE);
    });
  });
});
