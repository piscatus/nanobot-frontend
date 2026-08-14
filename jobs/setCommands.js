const axios = require("axios");

module.exports = {
  async execute(input) {
    try {
      const response = await axios.put(
        `${process.env.NANOBOT_API_URL}/commands`,
        input,
      );

      return response?.status === 202;
    } catch (err) {
      console.error("setCommands.js ERROR:", err);
      return false;
    }
  },
};
