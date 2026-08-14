const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(id, dropId, message) {
    return apiRequest("post", "/drop/update", { id, dropId, messageData: message });
  },
};
