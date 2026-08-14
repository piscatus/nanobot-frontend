const axios = require("axios");

module.exports = {
  async execute() {
    try {
      return await axios.get(`${process.env.NANOBOT_API_URL}/messages`);
    } catch (err) {
      console.error("checkMessages.js ERROR:", err);
      return null;
    }
  },
};
