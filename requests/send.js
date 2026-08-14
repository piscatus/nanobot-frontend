const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildId, userId, confirmation, input, address) {
    return apiRequest("put", "/requests/send", {
      address,
      confirmation,
      guildId,
      input,
      userId,
    });
  },
};
