const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, confirmation, address) {
    return apiRequest("put", "/requests/update", {
      address,
      confirmation,
      guildId,
      userId,
    });
  },
};
