const axios = require("axios");
const BASE = () => process.env.NANOBOT_API_URL;
const HEADERS = { "Content-Type": "application/json" };

async function apiRequest(method, path, body = null) {
  try {
    const url = `${BASE()}${path}`;
    const config = { headers: HEADERS };
    if (method === "get") return await axios.get(url, config);
    return await axios[method](url, body ?? {}, config);
  } catch (err) {
    console.error(`apiRequest ${method} ${path}:`, err);
    return null;
  }
}

module.exports = { apiRequest };
