const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, confirmation) {
    return apiRequest("put", "/requests/merge", { confirmation, guildId, userId });
  },
};
