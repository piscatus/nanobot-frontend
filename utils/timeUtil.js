const { NUMBERS, TIME } = require("./constants.js");

function formatUnit(value, unit) {
  return value + " " + unit + (value !== 1 ? "s" : "");
}

function durationError(minMinutes, maxDays, maxHours, maxMinutes) {
  return (
    "Invalid Duration: Must be **at least " +
    formatUnit(minMinutes, "minute") +
    "** in total and **cannot exceed " +
    formatUnit(maxDays, "day") +
    ", " +
    formatUnit(maxHours, "hour") +
    ", or " +
    formatUnit(maxMinutes, "minute") +
    "** in total."
  );
}

function activityDurationError() {
  return durationError(
    NUMBERS.MINIMUM_MINUTES_ACTIVE,
    NUMBERS.MAXIMUM_DAYS_ACTIVE,
    NUMBERS.MAXIMUM_HOURS_ACTIVE,
    NUMBERS.MAXIMUM_MINUTES_ACTIVE,
  );
}

function dropDurationError() {
  return durationError(
    NUMBERS.MINIMUM_MINUTES_DROP,
    NUMBERS.MAXIMUM_DAYS_DROP,
    NUMBERS.MAXIMUM_HOURS_DROP,
    NUMBERS.MAXIMUM_MINUTES_DROP,
  );
}

function formatTime(minutes) {
  if (minutes < TIME.MINUTES_PER_HOUR) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const days = Math.floor(minutes / TIME.MINUTES_PER_DAY);
  const hours = Math.floor(
    (minutes % TIME.MINUTES_PER_DAY) / TIME.MINUTES_PER_HOUR,
  );
  const remainingMinutes = minutes % TIME.MINUTES_PER_HOUR;

  const parts = [];
  if (days) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (remainingMinutes)
    parts.push(
      `${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`,
    );

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(" and ");

  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

module.exports = {
  formatTime,
  durationError,
  activityDurationError,
  dropDurationError,
};
