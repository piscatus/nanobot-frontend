const { apiRequest } = require("../utils/apiRequest.js");

module.exports = {
  /**
   * @param {number} [answerIndex] which answer button was pressed on a trivia
   *   drop; omitted for a plain drop so the request body is unchanged there.
   */
  async execute(dropId, userId, userRoles, answerIndex) {
    const body = { dropId, userId, userRoles };
    if (answerIndex !== undefined && answerIndex !== null) {
      body.answerIndex = answerIndex;
    }
    return apiRequest("post", "/requests/pickup", body);
  },
};
