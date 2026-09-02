const { PermissionsBitField } = require("discord.js");
const { carousel } = require("./buttonUtil.js");
const { sendEmbed } = require("./channelUtil.js");
const { buildEmbed } = require("./embedUtil.js");
const { COMMAND_OPTION_KEYS, STATUS_CODES } = require("./constants.js");
const {
  catchCommandException,
  catchMessageException,
  formatAdminPermissionMessage,
  formatErrorTitle,
} = require("./errorUtil.js");
const { getInteractionContext } = require("./interactionUtil.js");
const { isValidString } = require("./stringUtil.js");
const { checkStatuses } = require("./statusUtil.js");

/**
 * Returns the standard options for admin-only "post as message" behavior.
 * Use with executeReadOnlyEmbedCommand: { ...getAdminMessageOptions(interaction) }
 *
 * @param {object} interaction - Discord interaction
 * @returns {{ isMessage: boolean, isPrivileged: boolean, formatPermissionMessage: function }}
 */
function getAdminMessageOptions(interaction) {
  return {
    isMessage: interaction.options.getBoolean(COMMAND_OPTION_KEYS.MESSAGE),
    isPrivileged: interaction.memberPermissions?.has(
      PermissionsBitField.Flags.Administrator,
    ),
    formatPermissionMessage: formatAdminPermissionMessage,
  };
}

/**
 * Handles the standard command response flow: DM vs guild, message vs reply,
 * privileged vs non-privileged. Reduces cognitive complexity in command execute functions.
 *
 * @param {object} interaction - Discord interaction
 * @param {object} client - Discord client
 * @param {object} options - Response options
 * @param {object} options.embed - The embed to display
 * @param {string} options.commandKey - Command name for error messages
 * @param {boolean} options.isMessage - Whether to post as public message
 * @param {boolean} options.isPrivileged - Whether user has permission to post publicly
 * @param {function} options.formatPermissionMessage - (commandKey, userId) => string for permission error
 */
async function respondWithEmbed(interaction, client, options) {
  const {
    embed,
    commandKey,
    isMessage,
    isPrivileged,
    formatPermissionMessage,
  } = options;

  if (!interaction.guild) {
    if (isMessage) {
      await interaction.user.send({ embeds: [embed] });
      return await interaction.deleteReply();
    }
    return await interaction.editReply({ embeds: [embed] });
  }

  if (isPrivileged && isMessage) {
    const message = await sendEmbed(
      client,
      commandKey,
      interaction.channelId,
      embed,
      [],
    );
    if (message !== undefined && isValidString(message.id)) {
      return await interaction.deleteReply();
    }
    return await catchMessageException(interaction, commandKey);
  }

  if (!isPrivileged && isMessage) {
    return interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(commandKey),
          description: formatPermissionMessage(commandKey, interaction.user.id),
          error: true,
        }),
      ],
    });
  }

  return await interaction.editReply({ embeds: [embed] });
}

/**
 * Executes a read-only embed command: API call → checkStatuses → buildEmbed → respondWithEmbed.
 * Reduces boilerplate for commands like bonuses, creatures, currencies, server.
 *
 * @param {object} interaction - Discord interaction
 * @param {object} client - Discord client
 * @param {object} options - Command options
 * @param {string} options.commandKey - Command key for status/error handling
 * @param {function} options.apiCall - async (guildId, userId) => response
 * @param {function} options.buildEmbed - (response.data) => embed object
 * @param {boolean} options.isMessage - Whether to post as public message
 * @param {boolean} options.isPrivileged - Whether user has permission to post publicly
 * @param {function} options.formatPermissionMessage - (commandKey, userId) => string
 * @param {function} [options.beforeApiCall] - async (context) => void, optional pre-check; return truthy to abort
 */
async function executeReadOnlyEmbedCommand(interaction, client, options) {
  const {
    commandKey,
    apiCall,
    buildEmbed: buildEmbedFn,
    buildPanels: buildPanelsFn,
    isMessage,
    isPrivileged,
    formatPermissionMessage,
    beforeApiCall,
  } = options;

  try {
    const { guildId, userId } = getInteractionContext(interaction);

    if (beforeApiCall) {
      const abort = await beforeApiCall({ guildId, userId, interaction });
      if (abort) return;
    }

    const response = await apiCall(guildId, userId);

    if (
      !(await checkStatuses(
        interaction,
        response,
        STATUS_CODES.OK,
        commandKey,
      ))
    )
      return;

    // Filter buttons are for the requesting user's own reply. A public post is
    // a static snapshot, since its collector would expire and its buttons would
    // do nothing for everyone except whoever ran the command.
    if (buildPanelsFn && !isMessage) {
      const panels = buildPanelsFn(response.data);
      if (panels?.length > 0) {
        return await carousel(interaction, client, panels);
      }
    }

    const embed = buildEmbedFn(response.data);

    return await respondWithEmbed(interaction, client, {
      embed,
      commandKey,
      isMessage,
      isPrivileged,
      formatPermissionMessage,
    });
  } catch (err) {
    await catchCommandException(interaction, client, commandKey, err);
  }
}

module.exports = {
  executeReadOnlyEmbedCommand,
  getAdminMessageOptions,
  respondWithEmbed,
};
