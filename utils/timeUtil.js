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

function formatTime(minutes, seconds) {
  const mins = Number(minutes) || 0;
  const secs = Number(seconds) || 0;

  if (mins < TIME.MINUTES_PER_HOUR) {
    if (mins === 0 && secs > 0) {
      return formatUnit(secs, "second");
    }
    if (secs > 0) {
      return formatUnit(mins, "minute") + " and " + formatUnit(secs, "second");
    }
    return formatUnit(mins, "minute");
  }

  const days = Math.floor(mins / TIME.MINUTES_PER_DAY);
  const hours = Math.floor(
    (mins % TIME.MINUTES_PER_DAY) / TIME.MINUTES_PER_HOUR,
  );
  const remainingMinutes = mins % TIME.MINUTES_PER_HOUR;

  const parts = [];
  if (days) parts.push(formatUnit(days, "day"));
  if (hours) parts.push(formatUnit(hours, "hour"));
  if (remainingMinutes) parts.push(formatUnit(remainingMinutes, "minute"));
  if (secs) parts.push(formatUnit(secs, "second"));

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
