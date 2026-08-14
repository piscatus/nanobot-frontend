const axios = require("axios");

module.exports = {
  async execute(guildId, channelId, userId) {
    try {
      return await axios.put(
        `${process.env.NANOBOT_API_URL}/activities/updateOrCreate?guildId=${guildId}&channelId=${channelId}&userId=${userId}`,
      );
    } catch (err) {
      console.error("setActivity.js ERROR:", err);
      return false;
    }
  },
};
