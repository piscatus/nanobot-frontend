const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId) {
    return apiRequest("post", "/requests/audit", { guildId, userId });
  },
};
