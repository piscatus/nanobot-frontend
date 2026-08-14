const { isValidString } = require("./stringUtil.js");
const { formatTime } = require("./timeUtil.js");
const { getCommandIds } = require("./commandUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const {
  COLORS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_KEYS,
  EMOJIS,
  NUMBERS,
} = require("./constants.js");

function getTimeDetails(label, value, fallback = "") {
  return value && value !== 0 ? `**${label}: ${formatTime(value)}**` : fallback;
}

function getDetails(label, value, prefix = "", suffix = "", fallback = "") {
  return isValidString(value)
    ? value !== 0
      ? `**${label}: ${prefix}${value}${suffix}**`
      : fallback
    : fallback;
}

function getDetailsList(
  label,
  values,
  prefix = "",
  suffix = "",
  fallback = "",
) {
  if (values && values.length > 0 && isValidString(values[0])) {
    return `**${label}: ${values
      .map((value) => `${prefix}${value}${suffix}`)
      .join(", ")}**`;
  }
  return fallback;
}

function getChannelDetails(label, id, fallback) {
  return getDetails(label, id, "<#", ">", fallback);
}

function getRoleDetails(label, id, fallback) {
  return getDetails(label, id, "<@&", ">", fallback);
}

function getRoleDetailsList(label, ids, fallback) {
  return getDetailsList(label, ids, "<@&", ">", fallback);
}

function serverInfoTemplate(commands, config) {
  const commandMap = getCommandIds(commands);
  return (
    `## Activity Configurations` +
    "\n" +
    `${getTimeDetails(
      "Activity Duration",
      config.maximumMinutesActive,
      `**Activity Duration: ${NUMBERS.DEFAULT_MINUTES_ACTIVE} Minutes (Default)**`,
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.ACTIVITY_DURATION}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `${getDetails(
      "Maximum Users Active",
      config.maximumActiveUsers,
      "",
      "",
      `**Maximum Users Active: ${NUMBERS.DEFAULT_USERS_ACTIVE} (Default)**`,
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.USERS_ACTIVE}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `## Fishing Configurations` +
    "\n" +
    `${getChannelDetails(
      "Fishing Channel",
      config.fishingChannelId,
      "**No Configured Fishing Channel (Default)**",
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.FISHING_CHANNEL}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `${getTimeDetails(
      "Fishing Frequency",
      config.fishingFrequency,
      `**Fishing Frequency: ${NUMBERS.DEFAULT_FISHING_FREQUENCY} Minutes (Default)**`,
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.FISHING_FREQUENCY}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `${getRoleDetailsList(
      "Fishing Bypass Role(s)",
      config.fishingBypassRoles,
      "**No Configured Fishing Bypass Roles (Default)**",
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.FISHING_BYPASS_ROLE}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `${getRoleDetails(
      "Required Fishing Role",
      config.fishingRole,
      "**No Configured Required Fishing Role (Default)**",
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.FISHING_ROLE}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `${getDetails(
      "Error Message",
      config.fishingError,
      "",
      "",
      "**No Configured Error Message (Default)**",
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${COMMAND_OPTION_KEYS.FISHING_ERROR_MESSAGE}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>` +
    "\n" +
    `## Logging Configurations` +
    "\n" +
    `${getChannelDetails(
      "Fishing Logging Channel",
      config.fishingLoggingChannelId,
      "**No Configured Fishing Logging Channel (Default)**",
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.FISHING_LOGGING_CHANNEL
    }:${commandMap[COMMAND_KEYS.CONFIG]}>` +
    "\n" +
    `${getChannelDetails(
      "Transfer Logging Channel",
      config.transferLoggingChannelId,
      "**No Configured Transfer Logging Channel (Default)**",
    )}` +
    "\n" +
    `-# </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.TRANSFER_LOGGING_CHANNEL
    }:${commandMap[COMMAND_KEYS.CONFIG]}>` +
    "\n\n" +
    `-# Configurations can only be set by server administrators!`
  );
}

function buildServerEmbed(data) {
  const guildConfigurations = data.guildConfigurations;
  const config = {
    fishingLoggingChannelId: guildConfigurations.fishingLoggingChannelId,
    transferLoggingChannelId: guildConfigurations.transferLoggingChannelId,
    fishingChannelId: guildConfigurations.fishingChannelId,
    fishingError: guildConfigurations.fishingError,
    fishingFrequency: guildConfigurations.fishingFrequency,
    fishingBypassRoles: guildConfigurations.fishingBypassRoles,
    fishingRole: guildConfigurations.fishingRole,
    maximumActiveUsers: guildConfigurations.maximumActiveUsers,
    maximumMinutesActive: guildConfigurations.maximumMinutesActive,
  };
  return buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: `${EMOJIS.SERVER_GEAR} ${COMMAND_DESCRIPTIONS.SERVER}`,
    description: serverInfoTemplate(data.commands, config),
  });
}

function formatConfigurationsMessage(commands) {
  const commandMap = getCommandIds(commands);
  return `-# Server Configurations can be viewed with </${
    COMMAND_KEYS.SERVER
  }:${commandMap[COMMAND_KEYS.SERVER]}>.`;
}

module.exports = {
  buildServerEmbed,
  getTimeDetails,
  getDetails,
  getDetailsList,
  getChannelDetails,
  getRoleDetails,
  getRoleDetailsList,
  formatConfigurationsMessage,
  serverInfoTemplate,
};
