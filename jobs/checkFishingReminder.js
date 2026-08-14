const axios = require("axios");

module.exports = {
  async execute() {
    try {
      return await axios.get(`${process.env.NANOBOT_API_URL}/reminders`);
    } catch (err) {
      console.error("checkFishingReminder.js ERROR:", err);
      return null;
    }
  },
};
