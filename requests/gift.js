const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, channelId, userId, receiverIds, confirmation, input) {
    return apiRequest("put", "/requests/gift", {
      channelId,
      confirmation,
      guildId,
      input,
      receiverIds,
      userId,
    });
  },
};
