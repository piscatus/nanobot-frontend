const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  async execute(dropId, userId, userRoles) {
    return apiRequest("post", "/requests/pickup", { dropId, userId, userRoles });
  },
};
