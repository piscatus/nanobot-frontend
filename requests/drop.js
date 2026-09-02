const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(
    guildId,
    channelId,
    userId,
    duration,
    roleId,
    users,
    random,
    confirmation,
    input,
    username,
  ) {
    return apiRequest("put", "/requests/drop", {
      channelId,
      confirmation,
      duration,
      guildId,
      input,
      random,
      roleId,
      userId,
      username,
      users,
    });
  },
};
