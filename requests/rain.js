const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(
    guildId,
    channelId,
    userId,
    confirmation,
    duration,
    input,
    random,
    userIdsWithRole,
    users,
    roleId,
  ) {
    return apiRequest("put", "/requests/rain", {
      channelId,
      confirmation,
      duration,
      guildId,
      input,
      random,
      userId,
      userIdsWithRole,
      users,
      roleId,
    });
  },
};
