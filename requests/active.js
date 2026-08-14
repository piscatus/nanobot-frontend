const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(
    guildId,
    channelId,
    userId,
    duration,
    random,
    users,
    userIdsWithRole,
  ) {
    return apiRequest("post", "/requests/active", {
      channelId,
      duration,
      guildId,
      random,
      userId,
      userIdsWithRole,
      users,
    });
  },
};
