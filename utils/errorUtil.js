const { sendEmbed } = require("./channelUtil.js");
const { buildEmbed } = require("./embedUtil.js");

function formatErrorTitle(commandKey) {
  return commandKey.toUpperCase() + " ERROR";
}

async function catchCommandException(interaction, client, command, error) {
  try {
    const ERROR_EMBED = buildEmbed({
      title: formatErrorTitle(command),
      description:
        `**Error Stack -** ${error.stack}\n` +
        `**Error Name -** ${error.name}\n` +
        `**Error Message -** ${error.message}`,
      error: true,
    });

    await sendEmbed(
      client,
      command,
      process.env.ERROR_LOGGING_CHANNEL_ID,
      ERROR_EMBED,
      [],
    );
  } catch (err) {
    console.error(command + ".js Error:", error);
    console.error(
      command.toUpperCase() +
        " errorUtil.js catchCommandException (sendEmbed) Error:",
      err,
    );
  }
  try {
    await interaction.editReply({
      embeds: [
        buildEmbed({ title: formatErrorTitle(command), error: true }),
      ],
      components: [],
      ephemeral: true,
    });
  } catch (err) {
    console.error(
      command.toUpperCase() +
        " errorUtil.js catchCommandException (editReply) Error:",
      err,
    );
  }
}

async function catchMessageException(interaction, command) {
  try {
    return await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(command),
          description:
            "The " +
            command +
            " command was successful but there was a problem posting the message.\n\n" +
            "Please ensure Nanobot holds proper text channel permissions to send messages.",
          error: true,
        }),
      ],
      components: [],
      ephemeral: true,
    });
  } catch (err) {
    console.error(
      command + " errorUtil.js catchMessageException (editReply) Error:",
      err,
    );
  }
}

async function sendCommandErrorEmbed(command, errorMessage, interaction) {
  try {
    return await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(command),
          description: errorMessage,
          error: true,
        }),
      ],
      components: [],
      ephemeral: true,
    });
  } catch (err) {
    console.error(
      command + " errorUtil.js sendCommandErrorEmbed (editReply) Error:",
      err,
    );
  }
}

function formatAdminModPermissionMessage(embedType, userId) {
  return `<@${userId}>, you do not have permission to post the ${embedType} embed as a public message. This requires your user have the <@&${process.env.HOME_SERVER_ADMINISTRATOR_ROLE_ID}> or <@&${process.env.HOME_SERVER_MODERATOR_ROLE_ID}> role in this server.`;
}

function formatAdminPermissionMessage(embedType, userId) {
  return `<@${userId}>, you do not have permission to post the ${embedType} embed as a public message. This requires your user have Administrative privileges in this server.`;
}

module.exports = {
  catchCommandException,
  catchMessageException,
  formatErrorTitle,
  sendCommandErrorEmbed,
  formatAdminModPermissionMessage,
  formatAdminPermissionMessage,
};
