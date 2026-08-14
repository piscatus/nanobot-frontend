const { getCommandStatuses } = require("./commandUtil.js");
const { COMMAND_KEYS, STATUS_CODES } = require("./constants.js");
const { buildEmbed } = require("./embedUtil.js");
const {
  formatErrorTitle,
  sendCommandErrorEmbed,
} = require("./errorUtil.js");

async function checkStatuses(
  interaction,
  response,
  expectedStatusCode,
  command,
) {
  if (!response || response.status !== expectedStatusCode) {
    await interaction.editReply({
      embeds: [
        buildEmbed({ title: formatErrorTitle(command), error: true }),
      ],
      components: [],
      ephemeral: true,
    });
    return false;
  }
  if (response.data.errorMessage != null) {
    await sendCommandErrorEmbed(
      command,
      command === COMMAND_KEYS.FISH
        ? "The sailor <:sailor:" +
            process.env.SAILOR_EMOJI_ID +
            "> " +
            response.data.errorMessage
        : response.data.errorMessage,
      interaction,
    );
    return false;
  }
  const statusPrefix = "This command has been disabled ";
  const statusSuffix =
    "by the bot owner and cannot be executed at this time, sorry for the inconvenience!";
  const guildConfigurations = response.data.guildConfigurations;
  const userDetails = response.data.userDetails;

  const commandsStatus = getCommandStatuses(response.data.commands);

  if (
    interaction.user.id !== process.env.BOT_OWNER_USER_ID &&
    commandsStatus != null &&
    commandsStatus[command] !== "ACTIVE"
  ) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(command),
          description: statusPrefix + statusSuffix,
          error: true,
        }),
      ],
      components: [],
      ephemeral: true,
    });
    return false;
  }

  if (
    interaction.user.id !== process.env.BOT_OWNER_USER_ID &&
    guildConfigurations != null &&
    guildConfigurations.status !== "ACTIVE"
  ) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(command),
          description: statusPrefix + "in this server " + statusSuffix,
          error: true,
        }),
      ],
      components: [],
      ephemeral: true,
    });
    return false;
  }

  if (
    interaction.user.id !== process.env.BOT_OWNER_USER_ID &&
    userDetails != null &&
    userDetails.status !== "ACTIVE"
  ) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(command),
          description: statusPrefix + "for this user " + statusSuffix,
          error: true,
        }),
      ],
      components: [],
      ephemeral: true,
    });
    return false;
  }

  return true;
}

/**
 * Executes an API call and validates the response with checkStatuses.
 * @param {object} interaction - Discord interaction
 * @param {function} apiCall - async () => response
 * @param {string} commandKey - Command key for status checks
 * @returns {Promise<object|null>} Response data if OK, null if status check failed
 */
async function executeWithStatusCheck(interaction, apiCall, commandKey) {
  const response = await apiCall();
  if (
    !(await checkStatuses(
      interaction,
      response,
      STATUS_CODES.OK,
      commandKey,
    ))
  )
    return null;
  return response;
}

module.exports = {
  checkStatuses,
  executeWithStatusCheck,
};
