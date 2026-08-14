exports.sendDMEmbed = async function (client, command, userId, embed) {
  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      return null;
    }
    const dmChannel = await user.createDM();
    return await dmChannel.send({
      embeds: [embed],
    });
  } catch (logError) {
    console.error(
      command.toUpperCase() + " channelUtil.js sendDMEmbed Error:",
      logError,
    );
  }
};
