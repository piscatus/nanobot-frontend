const { apiRequest } = require("../utils/apiRequest.js");

/**
 * Creates a trivia drop. Unlike /drop there is no role or random option: the
 * API forces both off, and `users` is the maximum number of winners.
 * `category` and `difficulty` are optional filters for the question; null
 * means any. `seconds` is leftover duration (0–59); null means none.
 */
module.exports = {
  async execute(
    guildId,
    channelId,
    userId,
    duration,
    users,
    confirmation,
    input,
    username,
    category,
    difficulty,
    seconds,
  ) {
    return apiRequest("put", "/requests/triviadrop", {
      category,
      channelId,
      confirmation,
      difficulty,
      duration,
      guildId,
      input,
      seconds,
      userId,
      username,
      users,
    });
  },
};
