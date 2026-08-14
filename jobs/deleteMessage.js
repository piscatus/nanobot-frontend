const axios = require("axios");

module.exports = {
  async execute(id) {
    try {
      return await axios.delete(
        `${process.env.NANOBOT_API_URL}/messages/${id}`,
      );
    } catch (err) {
      console.error("deleteMessage.js ERROR:", err);
      return null;
    }
  },
};
