const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(guildConfigurations) {
    return apiRequest("put", "/requests/config", guildConfigurations);
  },
};
