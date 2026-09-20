const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { computeAndValidateDuration } = require("./activitiesUtil.js");
const {
  COMMAND_KEYS,
  CUSTOM_IDS,
  EMOJIS,
  MAXIMUM_SELECT_OPTIONS,
  NUMBERS,
} = require("./constants.js");
const { formatErrorTitle } = require("./errorUtil.js");
const { isValidString } = require("./stringUtil.js");
const { formatTime } = require("./timeUtil.js");

/** Discord refuses a button whose label is longer than this. */
const MAXIMUM_BUTTON_LABEL_LENGTH = 80;

/** Regional indicator letters, one per answer button, in display order. */
const ANSWER_LETTERS = Object.freeze(["🇦", "🇧", "🇨", "🇩", "🇪"]);

function triviaDropDurationError() {
  return (
    `Trivia drops must last between **${NUMBERS.MINIMUM_MINUTES_TRIVIADROP} ` +
    `minute** and **${NUMBERS.MAXIMUM_MINUTES_TRIVIADROP} minutes**!`
  );
}

function triviaDropSecondsError() {
  return (
    `When minutes are not set, trivia drops must last between ` +
    `**${NUMBERS.MINIMUM_SECONDS_TRIVIADROP} seconds** and ` +
    `**${NUMBERS.MAXIMUM_SECONDS_TRIVIADROP} seconds**!`
  );
}

/**
 * Minutes and optional leftover seconds for a trivia drop.
 *
 * Discord cannot setMinValue(10) on seconds: 2 minutes and 5 seconds is valid.
 * The 10-second floor applies only when duration_minutes is not > 0.
 */
function computeAndValidateTriviaDuration(minutes, seconds) {
  const minutesSet = minutes != null;
  const secondsSet = seconds != null;

  if (
    secondsSet &&
    (seconds < 0 || seconds > NUMBERS.MAXIMUM_SECONDS_TRIVIADROP)
  ) {
    return {
      minutes: minutes ?? 0,
      seconds,
      error: {
        title: formatErrorTitle(COMMAND_KEYS.TRIVIADROP),
        description: triviaDropSecondsError(),
      },
    };
  }

  if (
    secondsSet &&
    !(minutes > 0) &&
    seconds < NUMBERS.MINIMUM_SECONDS_TRIVIADROP
  ) {
    return {
      minutes: minutes ?? 0,
      seconds,
      error: {
        title: formatErrorTitle(COMMAND_KEYS.TRIVIADROP),
        description: triviaDropSecondsError(),
      },
    };
  }

  if (minutesSet) {
    const { minutes: totalMinutes, error } = computeAndValidateDuration(
      null,
      null,
      minutes,
      NUMBERS.MINIMUM_MINUTES_TRIVIADROP,
      NUMBERS.MAXIMUM_MINUTES_TRIVIADROP,
      triviaDropDurationError,
      COMMAND_KEYS.TRIVIADROP,
    );
    if (error) {
      return { minutes: totalMinutes, seconds: seconds ?? 0, error };
    }
    return { minutes: totalMinutes, seconds: seconds ?? 0, error: null };
  }

  if (secondsSet) {
    return { minutes: 0, seconds, error: null };
  }

  return { minutes: 0, seconds: null, error: null };
}

function capitalize(value) {
  if (!isValidString(value)) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Autocomplete suggestions for the category option: the categories that have
 * enabled questions, filtered by what has been typed so far. Discord discards
 * anything past 25 entries, so the list is cut there.
 */
function buildCategoryChoices(categories, query) {
  const search = String(query ?? "")
    .trim()
    .toLowerCase();
  return (categories ?? [])
    .filter((category) => isValidString(category))
    .filter((category) => category.toLowerCase().includes(search))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAXIMUM_SELECT_OPTIONS)
    .map((category) => ({ name: category, value: category }));
}

/**
 * Matches a typed category against the known list, ignoring case. An exact
 * match wins; failing that, a fragment that appears in exactly one category
 * ("television" for "Entertainment: Television") is accepted, since a user
 * who types instead of picking a suggestion still means that category.
 * Returns the canonical spelling, null for no input, or undefined when the
 * list is loaded and nothing matches. When no list is loaded the input is
 * passed through and the API does the checking.
 */
function resolveCategory(categories, input) {
  if (!isValidString(input)) return null;
  const wanted = String(input).trim();
  if (!Array.isArray(categories) || categories.length === 0) return wanted;
  const lowered = wanted.toLowerCase();
  const exact = categories.find(
    (category) => category.toLowerCase() === lowered,
  );
  if (exact) return exact;
  const partial = categories.filter((category) =>
    category.toLowerCase().includes(lowered),
  );
  return partial.length === 1 ? partial[0] : undefined;
}

/**
 * One button per answer, labelled with the answer itself. The bank rejects
 * answers longer than a label on insert, so the clamp here is a last line of
 * defence against a row that arrived by another route; it must never be
 * relied on for readability.
 */
function buildAnswerButtons(answers) {
  const row = new ActionRowBuilder();
  (answers ?? [])
    .slice(0, NUMBERS.MAXIMUM_TRIVIA_ANSWERS)
    .forEach((answer, index) => {
      let label = String(answer ?? "").trim();
      if (label.length > MAXIMUM_BUTTON_LABEL_LENGTH) {
        console.warn(
          `triviaUtil: answer exceeds ${MAXIMUM_BUTTON_LABEL_LENGTH} characters and was clamped: ${label}`,
        );
        label = label.slice(0, MAXIMUM_BUTTON_LABEL_LENGTH - 1) + "…";
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`${CUSTOM_IDS.TRIVIA_ANSWER_PREFIX}${index}`)
          .setLabel(label || "?")
          .setEmoji(ANSWER_LETTERS[index])
          .setStyle(ButtonStyle.Primary),
      );
    });
  return row;
}

/**
 * The 0-based answer index carried by a trivia button's custom id, or null when
 * the id is not one of ours or is malformed.
 */
function parseTriviaCustomId(customId) {
  if (
    typeof customId !== "string" ||
    !customId.startsWith(CUSTOM_IDS.TRIVIA_ANSWER_PREFIX)
  ) {
    return null;
  }
  const raw = customId.slice(CUSTOM_IDS.TRIVIA_ANSWER_PREFIX.length);
  if (!/^\d+$/.test(raw)) return null;
  const index = Number(raw);
  return index < NUMBERS.MAXIMUM_TRIVIA_ANSWERS ? index : null;
}

/**
 * Fields for the live trivia embed. The answers are deliberately absent: they
 * live on the buttons alone, so nothing in the embed can hint at the right one.
 */
function buildTriviaEmbedFields(drop) {
  const fields = [];
  const trivia = drop?.trivia;
  if (!trivia) return fields;

  if (isValidString(trivia.category)) {
    fields.push({
      name: EMOJIS.TRIVIA_BRAIN + " Category",
      value: `> **${trivia.category}**`,
      inline: true,
    });
  }
  if (isValidString(trivia.difficulty)) {
    fields.push({
      name: EMOJIS.LEVEL_CHARTS + " Difficulty",
      value: `> **${capitalize(trivia.difficulty)}**`,
      inline: true,
    });
  }
  if (isValidString(drop.duration) || isValidString(drop.seconds)) {
    fields.push({
      name: EMOJIS.TIMESTAMP_HOURGLASS + " Drop Duration",
      value: `> **${formatTime(drop.duration, drop.seconds)}**`,
      inline: true,
    });
  }
  if (isValidString(drop.endTime)) {
    const unixTimestamp = Math.floor(new Date(drop.endTime).getTime() / 1000);
    fields.push({
      name: EMOJIS.TIMESTAMP_CLOCK + " Drop Ends",
      value: `> <t:${unixTimestamp}:R>`,
      inline: true,
    });
  }
  if (isValidString(drop.maximumEntries) && drop.maximumEntries.length < 4) {
    fields.push({
      name: EMOJIS.AWARD_TROPHY + " Maximum Winners",
      value: `> **${drop.maximumEntries}**`,
      inline: true,
    });
  }
  return fields;
}

/** The question block that follows the value line in the live embed. */
function formatQuestion(trivia) {
  return `### ${EMOJIS.TRIVIA_QUESTION} ${trivia.question}`;
}

module.exports = {
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
};
