const {
  formatUserMentions,
  isValidString,
} = require("./stringUtil.js");
const { formatTime } = require("./timeUtil.js");
const { getCommandIds } = require("./commandUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const { formatErrorTitle } = require("./errorUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  TIME,
  NUMBERS,
} = require("./constants.js");
const { activityDurationError } = require("./timeUtil.js");

function durationSpecified(days, hours, minutes) {
  return days != null || hours != null || minutes != null;
}

/**
 * Computes total minutes from duration options and validates against min/max.
 * @param {number|null} days - Duration days
 * @param {number|null} hours - Duration hours
 * @param {number|null} minutes - Duration minutes
 * @param {number} minMinutes - Minimum allowed total minutes
 * @param {number} maxMinutes - Maximum allowed total minutes
 * @param {function} durationErrorFn - () => string for error description
 * @param {string} commandKey - Command name for error title
 * @returns {{ minutes: number, error: { title: string, description: string }|null }}
 */
function computeAndValidateDuration(
  days,
  hours,
  minutes,
  minMinutes,
  maxMinutes,
  durationErrorFn,
  commandKey,
) {
  if (!durationSpecified(days, hours, minutes)) {
    return { minutes: 0, error: null };
  }
  const totalMinutes = combineDurations(days, hours, minutes);
  if (totalMinutes > maxMinutes || totalMinutes < minMinutes) {
    return {
      minutes: totalMinutes,
      error: {
        title: formatErrorTitle(commandKey),
        description: durationErrorFn(),
      },
    };
  }
  return { minutes: totalMinutes, error: null };
}

function combineDurations(days, hours, minutes) {
  return (
    (minutes || 0) +
    (hours || 0) * TIME.MINUTES_PER_HOUR +
    (days || 0) * TIME.MINUTES_PER_DAY
  );
}

function formatActivities(
  usersDatabase,
  configMaximumMinutesActive,
  configMaximumActiveUsers,
  minutesActiveConfig,
  users,
  random,
  roleId,
  channelId,
  commands,
  CONFIG_NOTE,
) {
  const DEFAULT_MINUTES_ACTIVE = NUMBERS.DEFAULT_MINUTES_ACTIVE;
  const DEFAULT_USERS_ACTIVE = NUMBERS.DEFAULT_USERS_ACTIVE;

  const criteria = [
    minutesActiveConfig > 0
      ? `-# Activity Duration: **${formatTime(minutesActiveConfig)}**`
      : configMaximumMinutesActive > 0
      ? `-# Activity Duration: **${formatTime(
          configMaximumMinutesActive,
        )}** (Default)`
      : `-# Activity Duration: **${formatTime(
          DEFAULT_MINUTES_ACTIVE,
        )}** (Default)`,

    users > 0
      ? `-# Maximum Active Users: **${users}**`
      : configMaximumActiveUsers > 0
      ? `-# Maximum Active Users: **${configMaximumActiveUsers}** (Default)`
      : `-# Maximum Active Users: **${DEFAULT_USERS_ACTIVE}** (Default)`,

    isValidString(roleId) && `-# Required User Role: <@&${roleId}>`,
    isValidString(random) &&
      random !== 0 &&
      `-# Random Active Users: **${random}**`,
  ].filter(Boolean);

  const activeUsersString = formatUserMentions(
    usersDatabase,
    (u) => u.userId,
  );

  const totalUsersMessage =
    usersDatabase.length === 1
      ? `### With the above activity criteria, there is ***1*** user active:`
      : `### With the above activity criteria, there are ***${usersDatabase.length}*** users active:`;

  const headerString = `### Who is active in <#${channelId}>?\n`;

  if (!usersDatabase.length) {
    return (
      headerString +
      `${criteria.join("\n")}\n` +
      `### With the above activity criteria, there are no users active.\n` +
      `${CONFIG_NOTE}`
    );
  }

  const commandMap = getCommandIds(commands);

  const footerString =
    usersDatabase.length > 0
      ? `-# Users mentioned above will receive funds when executing </${COMMAND_KEYS.RAIN}:${commandMap.rain}> with the same activity criteria in this channel, excluding the command issuer.\n${CONFIG_NOTE}`
      : CONFIG_NOTE;

  return (
    headerString +
    `${criteria.join("\n")}\n` +
    `${totalUsersMessage}\n` +
    `${activeUsersString}\n\n` +
    `${footerString}`
  );
}

function buildActiveEmbed(data, options) {
  const {
    minutesActiveConfig,
    users,
    random,
    roleId,
    channelId,
  } = options;
  const { activities, guildConfigurations, commands } = data;
  const embedContent = formatActivities(
    activities,
    guildConfigurations.maximumMinutesActive,
    guildConfigurations.maximumActiveUsers,
    minutesActiveConfig,
    users,
    random,
    roleId,
    channelId,
    commands,
    formatDefaultActivityMessage(commands),
  );
  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: EMOJIS.MAN_RUNNING + " " + COMMAND_DESCRIPTIONS.ACTIVE,
    description: embedContent,
  });
}

function formatDefaultActivityMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    `-# Default activity duration can be set by server administrators with </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.ACTIVITY_DURATION}:${commandMap.config}>.\n` +
    `-# Default maximum active users can be set by server administrators with </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.USERS_ACTIVE}:${commandMap.config}>.`
  );
}

module.exports = {
  activityDurationError,
  buildActiveEmbed,
  combineDurations,
  computeAndValidateDuration,
  durationSpecified,
  formatActivities,
  formatDefaultActivityMessage,
};
