exports.deleteMessage = async function (client, command, channelId, messageId) {
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(
        `${command.toUpperCase()} channelUtil.js deleteMessage Error: Channel not found.`,
      );
      return;
    }

    const message = await channel.messages.fetch(messageId);
    if (!message) {
      console.error(
        `${command.toUpperCase()} channelUtil.js deleteMessage Error: Message not found.`,
      );
      return;
    }

    return await message.delete();
  } catch (logError) {
    // console.error(
    //   `${command.toUpperCase()} channelUtil.js deleteMessage Error:`,
    //   logError,
    // );
  }
};

exports.editEmbed = async function (
  client,
  command,
  channelId,
  embed,
  components,
  messageId,
) {
  try {
    const channel = client.channels.cache.get(channelId);
    if (channel === undefined) {
      return null;
    }

    const message = await channel.messages.fetch(messageId);
    if (message === null) {
      return null;
    }
    return await message.edit({
      embeds: [embed],
      components: components,
    });
  } catch (logError) {
    // console.error(
    //   command.toUpperCase() + " channelUtil.js editEmbed Error:",
    //   logError,
    // );
  }
};

exports.send = async function (client, command, channelId, content) {
  try {
    const channel = client.channels.cache.get(channelId);
    if (channel === undefined) return null;
    const response = await channel.send({
      content: content,
      allowedMentions: {
        parse: ["users"],
        roles: [],
      },
    });
    return response;
  } catch (logError) {
    // console.error(
    //   command.toUpperCase() + " channelUtil.js send Error:",
    //   logError,
    // );
  }
};

exports.sendWithFile = async function (
  client,
  command,
  channelId,
  content,
  file,
) {
  try {
    const channel = client.channels.cache.get(channelId);
    if (channel === undefined) return null;
    const response = await channel.send({
      content: content,
      files: file,
    });
    return response;
  } catch (logError) {
    // console.error(
    //   command.toUpperCase() + " channelUtil.js sendWithFile Error:",
    //   logError,
    // );
  }
};

exports.sendWithEmbed = async function (
  client,
  command,
  channelId,
  content,
  embed,
) {
  try {
    const channel = client.channels.cache.get(channelId);
    if (channel === undefined) return null;
    const response = await channel.send({
      content: content,
      embeds: [embed],
    });
    return response;
  } catch (logError) {
    // console.error(
    //   command.toUpperCase() + " channelUtil.js sendWithEmbed Error:",
    //   logError,
    // );
  }
};

exports.sendEmbed = async function (
  client,
  command,
  channelId,
  embed,
  components,
) {
  try {
    const channel = client.channels.cache.get(channelId);
    if (channel === undefined) {
      return null;
    }
    return await channel.send({
      embeds: [embed],
      components: components,
    });
  } catch (logError) {
    // console.error(
    //   command.toUpperCase() + " channelUtil.js sendEmbed Error:",
    //   logError,
    // );
  }
};
