const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  ANSWER_LETTERS,
  MAXIMUM_BUTTON_LABEL_LENGTH,
  buildAnswerButtons,
  buildCategoryChoices,
  buildTriviaEmbedFields,
  computeAndValidateTriviaDuration,
  formatQuestion,
  parseTriviaCustomId,
  resolveCategory,
  triviaDropDurationError,
  triviaDropSecondsError,
} = require("./triviaUtil.js");
const { CUSTOM_IDS, EMOJIS, NUMBERS } = require("./constants.js");

describe("triviaUtil", () => {
  describe("ANSWER_LETTERS", () => {
    it("exports regional indicator letters in display order", () => {
      expect(ANSWER_LETTERS).toEqual(["🇦", "🇧", "🇨", "🇩", "🇪"]);
    });
  });

  describe("MAXIMUM_BUTTON_LABEL_LENGTH", () => {
    it("matches Discord's button label limit", () => {
      expect(MAXIMUM_BUTTON_LABEL_LENGTH).toBe(80);
    });
  });

  describe("triviaDropDurationError", () => {
    it("states the 1 to 60 minute window", () => {
      expect(triviaDropDurationError()).toBe(
        `Trivia drops must last between **${NUMBERS.MINIMUM_MINUTES_TRIVIADROP} ` +
          `minute** and **${NUMBERS.MAXIMUM_MINUTES_TRIVIADROP} minutes**!`,
      );
    });
  });

  describe("computeAndValidateTriviaDuration", () => {
    it("uses the API default when neither option is set", () => {
      expect(computeAndValidateTriviaDuration(null, null)).toEqual({
        minutes: 0,
        seconds: null,
        error: null,
      });
    });

    it("accepts seconds of at least 10 when minutes is not set", () => {
      expect(computeAndValidateTriviaDuration(null, 10)).toEqual({
        minutes: 0,
        seconds: 10,
        error: null,
      });
      expect(computeAndValidateTriviaDuration(null, 30).error).toBeNull();
    });

    it("rejects seconds under 10 when minutes is not set", () => {
      const result = computeAndValidateTriviaDuration(null, 5);
      expect(result.error).not.toBeNull();
      expect(result.error.description).toBe(triviaDropSecondsError());
    });

    it("allows seconds under 10 when minutes is greater than 0", () => {
      expect(computeAndValidateTriviaDuration(2, 5)).toEqual({
        minutes: 2,
        seconds: 5,
        error: null,
      });
    });
  });

  describe("buildCategoryChoices", () => {
    const categories = ["Science", "History", "General Knowledge", "Sports"];

    it("returns name/value pairs sorted alphabetically", () => {
      expect(buildCategoryChoices(categories, "")).toEqual([
        { name: "General Knowledge", value: "General Knowledge" },
        { name: "History", value: "History" },
        { name: "Science", value: "Science" },
        { name: "Sports", value: "Sports" },
      ]);
    });

    it("filters with a case-insensitive substring", () => {
      expect(buildCategoryChoices(categories, "SCI")).toEqual([
        { name: "Science", value: "Science" },
      ]);
    });

    it("treats a missing query as no filter", () => {
      expect(buildCategoryChoices(categories, undefined)).toHaveLength(4);
    });

    it("skips blank categories and caps the list at 25", () => {
      const many = Array.from({ length: 30 }, (_, i) => `Cat ${i}`);
      many.push("");
      many.push("0");
      const choices = buildCategoryChoices(many, "");
      expect(choices).toHaveLength(25);
      expect(choices.every((choice) => choice.name && choice.value)).toBe(true);
    });

    it("returns an empty list when categories are missing", () => {
      expect(buildCategoryChoices(null, "sci")).toEqual([]);
    });
  });

  describe("resolveCategory", () => {
    it("returns null when the input is blank or 0", () => {
      expect(resolveCategory(["Science"], "")).toBeNull();
      expect(resolveCategory(["Science"], "0")).toBeNull();
      expect(resolveCategory(["Science"], null)).toBeNull();
    });

    it("returns the trimmed input when the category list is empty or absent", () => {
      expect(resolveCategory([], "Science")).toBe("Science");
      expect(resolveCategory(null, "  Science  ")).toBe("Science");
    });

    it("returns the canonical spelling on a case-insensitive match", () => {
      expect(resolveCategory(["Science", "History"], "science")).toBe(
        "Science",
      );
    });

    it("returns undefined when the list is non-empty and nothing matches", () => {
      expect(resolveCategory(["Science"], "History")).toBeUndefined();
    });
  });

  describe("buildAnswerButtons", () => {
    it("builds a primary action row with trivia custom ids and letter emojis", () => {
      const row = buildAnswerButtons(["Paris", "London"]);
      expect(row).toBeInstanceOf(ActionRowBuilder);
      expect(row.components).toHaveLength(2);
      expect(row.components[0]).toBeInstanceOf(ButtonBuilder);
      expect(row.components[0].data.custom_id).toBe(
        `${CUSTOM_IDS.TRIVIA_ANSWER_PREFIX}0`,
      );
      expect(row.components[0].data.label).toBe("Paris");
      expect(row.components[0].data.emoji.name).toBe(ANSWER_LETTERS[0]);
      expect(row.components[0].data.style).toBe(ButtonStyle.Primary);
      expect(row.components[1].data.custom_id).toBe("trivia:1");
      expect(row.components[1].data.label).toBe("London");
      expect(row.components[1].data.emoji.name).toBe(ANSWER_LETTERS[1]);
    });

    it("clamps labels over 80 characters, warns, and appends an ellipsis", () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const long = "x".repeat(MAXIMUM_BUTTON_LABEL_LENGTH + 1);
      const row = buildAnswerButtons([long]);
      const label = row.components[0].data.label;

      expect(warn).toHaveBeenCalledWith(
        `triviaUtil: answer exceeds ${MAXIMUM_BUTTON_LABEL_LENGTH} characters and was clamped: ${long}`,
      );
      expect(label).toHaveLength(MAXIMUM_BUTTON_LABEL_LENGTH);
      expect(label.endsWith("…")).toBe(true);
      expect(label.startsWith("x".repeat(MAXIMUM_BUTTON_LABEL_LENGTH - 1))).toBe(
        true,
      );
      warn.mockRestore();
    });

    it("uses a question mark for a blank answer", () => {
      const row = buildAnswerButtons(["A", "  ", "C"]);
      expect(row.components[1].data.label).toBe("?");
    });

    it("keeps at most four buttons", () => {
      const row = buildAnswerButtons(["A", "B", "C", "D", "E"]);
      expect(row.components).toHaveLength(NUMBERS.MAXIMUM_TRIVIA_ANSWERS);
      expect(row.components.map((button) => button.data.custom_id)).toEqual([
        "trivia:0",
        "trivia:1",
        "trivia:2",
        "trivia:3",
      ]);
    });

    it("returns an empty row when answers are missing", () => {
      const row = buildAnswerButtons(null);
      expect(row.components).toHaveLength(0);
    });
  });

  describe("parseTriviaCustomId", () => {
    it("returns the 0-based index for trivia:0 through trivia:3", () => {
      expect(parseTriviaCustomId("trivia:0")).toBe(0);
      expect(parseTriviaCustomId("trivia:3")).toBe(3);
    });

    it("returns null for pickup, malformed ids, and out-of-range indexes", () => {
      expect(parseTriviaCustomId("pickup")).toBeNull();
      expect(parseTriviaCustomId("trivia:")).toBeNull();
      expect(parseTriviaCustomId("trivia:x")).toBeNull();
      expect(parseTriviaCustomId("trivia:9")).toBeNull();
      expect(parseTriviaCustomId("trivia:4")).toBeNull();
      expect(parseTriviaCustomId(null)).toBeNull();
    });
  });

  describe("buildTriviaEmbedFields", () => {
    const drop = {
      duration: 3,
      endTime: "2025-03-15T12:00:00.000Z",
      maximumEntries: "5",
      trivia: {
        category: "Science",
        difficulty: "HARD",
        question: "What is 2+2?",
        answers: ["Paris", "London", "Berlin", "Madrid"],
      },
    };

    it("returns category, difficulty, duration, end time, and maximum winners", () => {
      const fields = buildTriviaEmbedFields(drop);
      expect(fields.map((field) => field.name)).toEqual([
        EMOJIS.TRIVIA_BRAIN + " Category",
        EMOJIS.LEVEL_CHARTS + " Difficulty",
        EMOJIS.TIMESTAMP_HOURGLASS + " Drop Duration",
        EMOJIS.TIMESTAMP_CLOCK + " Drop Ends",
        EMOJIS.AWARD_TROPHY + " Maximum Winners",
      ]);
      expect(fields[0].value).toContain("Science");
      expect(fields[1].value).toContain("Hard");
      expect(fields[2].value).toContain("3 minutes");
      expect(fields[3].value).toBe("> <t:1742040000:R>");
      expect(fields[4].value).toContain("5");
    });

    it("includes leftover seconds on the duration field", () => {
      const fields = buildTriviaEmbedFields({
        ...drop,
        duration: 2,
        seconds: 5,
      });
      const duration = fields.find((field) =>
        field.name.includes("Drop Duration"),
      );
      expect(duration.value).toContain("2 minutes and 5 seconds");
    });

    it("never includes any answer text", () => {
      const serialized = JSON.stringify(buildTriviaEmbedFields(drop));
      expect(serialized).not.toContain("Paris");
      expect(serialized).not.toContain("London");
      expect(serialized).not.toContain("Berlin");
      expect(serialized).not.toContain("Madrid");
    });

    it("omits Maximum Winners when the maximumEntries string is 4+ characters", () => {
      const fields = buildTriviaEmbedFields({
        ...drop,
        maximumEntries: "1000",
      });
      expect(fields.some((field) => field.name.includes("Maximum Winners"))).toBe(
        false,
      );
    });

    it("returns an empty list when the drop has no trivia", () => {
      expect(buildTriviaEmbedFields({ duration: 3 })).toEqual([]);
      expect(buildTriviaEmbedFields(null)).toEqual([]);
    });
  });

  describe("formatQuestion", () => {
    it("prefixes the question with the trivia question emoji", () => {
      expect(formatQuestion({ question: "What is 2+2?" })).toBe(
        `### ${EMOJIS.TRIVIA_QUESTION} What is 2+2?`,
      );
    });
  });
});
