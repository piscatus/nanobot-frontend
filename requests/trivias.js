const { apiRequest } = require("../utils/apiRequest.js");

/** Read access to the trivia question bank; only categories are needed today. */
module.exports = {
  /** Distinct categories with at least one enabled question, sorted. */
  async getCategories() {
    return apiRequest("get", "/trivias/categories");
  },
};
