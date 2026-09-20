const triviasApi = require("../requests/trivias.js");

/**
 * Re-reads the trivia categories that back /triviadrop's autocomplete.
 *
 * <p>The list is loaded once at boot, but a category only exists once a
 * question in it is enabled, and questions are enabled by hand after review.
 * Without this, a freshly enabled category could not be picked until the bot
 * restarted. A failed read keeps the previous list rather than emptying it.
 *
 * @returns {boolean} whether the list was updated
 */
module.exports = {
  async execute(client) {
    const response = await triviasApi.getCategories();
    if (!Array.isArray(response?.data)) {
      return false;
    }
    if (!client.commandContext) {
      client.commandContext = {};
    }
    client.commandContext.triviaCategories = response.data;
    return true;
  },
};
