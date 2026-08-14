const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, global) {
    return apiRequest("post", "/requests/aliases", { guildId, global, userId });
  },
};
