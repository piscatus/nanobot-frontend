const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, confirmation, input) {
    return apiRequest("put", "/requests/sell", {
      confirmation,
      guildId,
      input,
      userId,
    });
  },
};
