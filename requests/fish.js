const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, userRoles) {
    return apiRequest("put", "/requests/fish", { guildId, userId, userRoles });
  },
};
