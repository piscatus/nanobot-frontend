const axios = require("axios");

module.exports = {
  async execute() {
    try {
      const url = `${process.env.NANOBOT_API_URL}/creatures`;
      const response = await axios.get(url);
      return response;
    } catch (err) {
      console.error("getCreatures.js ERROR:", err);
      return null;
    }
  },
};
