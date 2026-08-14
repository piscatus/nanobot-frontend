const axios = require("axios");

module.exports = {
  async execute(id) {
    try {
      return await axios.put(
        `${process.env.NANOBOT_API_URL}/anglers/restless/${id}`,
      );
    } catch (err) {
      console.error("setRestless.js ERROR:", err);
      return false;
    }
  },
};
