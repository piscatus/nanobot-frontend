const { execute: checkMessages } = require("./checkMessages.js");
const { execute: deleteMessage } = require("./deleteMessage.js");
const { editEmbed, sendEmbed } = require("../utils/channelUtil.js");
const { sendDMEmbed } = require("../utils/userUtil.js");
const { STATUS_CODES } = require("../utils/constants.js");
const { buildEmbed } = require("../utils/embedUtil.js");
const { isValidString } = require("../utils/stringUtil.js");

module.exports = {
  async execute(client) {
    try {
      const response = await checkMessages();

      if (!response?.data) {
        return;
      }

      for (const message of response.data) {
        const deleteResponse = await deleteMessage(message.id);

        if (deleteResponse?.status !== STATUS_CODES.NO_CONTENT) {
          continue;
        }

        const embed = buildEmbed({
          color: message.color,
          title: message.title,
          description: message.content,
          url: message.url,
          footer: message.footer,
          fields: message.list,
        });

        // Direct Message
        if (isValidString(message.userId)) {
          await sendDMEmbed(client, "sendDirectMessage", message.userId, embed);
        }
        // Edit Guild Message
        else if (isValidString(message.messageId)) {
          await editEmbed(
            client,
            "editMessage",
            message.channelId,
            embed,
            [],
            message.messageId,
          );
        } 
        // Send Guild Message
        else {
          await sendEmbed(client, "sendMessage", message.channelId, embed, []);
        }
      }
    } catch (err) {
      console.error("sendMessages.js ERROR:", err);
    }
  },
};
