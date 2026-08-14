const { COMMAND_KEYS } = require("./constants.js");
const { capitalize } = require("./stringUtil.js");

function getCommandIds(commands) {
  return commands?.reduce((acc, command) => {
    acc[command.name] = command.commandId;
    return acc;
  }, {});
}

function getCommandStatuses(commands) {
  return commands?.reduce((acc, command) => {
    acc[command.name] = command.status;
    return acc;
  }, {});
}

function formatMergeMessage(commands, subordinateUserId, item, location) {
  const commandMap = getCommandIds(commands);
  return `-# Use </${COMMAND_KEYS.MERGE}:${
    commandMap[COMMAND_KEYS.MERGE]
  }> to consolidate <@${subordinateUserId}>'s ${item} into your ${location}!`;
}

function formatRequestTitleMessage(emoji, userId, command) {
  return `${emoji} ${userId}'s ${capitalize(command)} Request`;
}

module.exports = {
  getCommandIds,
  getCommandStatuses,
  formatMergeMessage,
  formatRequestTitleMessage,
};
