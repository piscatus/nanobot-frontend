const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId) {
    return apiRequest("post", "/requests/help", { guildId, userId });
  },
};
