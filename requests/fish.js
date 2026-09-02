const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, userRoles, ticker = null) {
    return apiRequest("put", "/requests/fish", {
      guildId,
      userId,
      userRoles,
      ticker,
    });
  },
};
