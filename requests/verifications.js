const axios = require("axios");

const base = () => process.env.NANOBOT_API_URL;
const headers = { "Content-Type": "application/json" };

module.exports = {
  /** GET /verifications/userId/:userId/check - 200 = verified, 401 = need puzzle (body = emojis) */
  async check(userId) {
    try {
      return await axios.get(
        `${base()}/verifications/userId/${encodeURIComponent(userId)}/check`,
        { headers, validateStatus: () => true },
      );
    } catch (err) {
      console.error("/requests/verifications.js check ERROR:", err);
      return null;
    }
  },

  /** GET /verifications/userId/:userId - get verification by userId */
  async getByUserId(userId) {
    try {
      return await axios.get(
        `${base()}/verifications/userId/${encodeURIComponent(userId)}`,
        { headers, validateStatus: () => true },
      );
    } catch (err) {
      console.error("/requests/verifications.js getByUserId ERROR:", err);
      return null;
    }
  },

  /** POST /verifications - create verification for userId */
  async create(userId) {
    try {
      return await axios.post(
        `${base()}/verifications`,
        { userId },
        { headers, validateStatus: () => true },
      );
    } catch (err) {
      console.error("/requests/verifications.js create ERROR:", err);
      return null;
    }
  },

  /** PUT /verifications/:id - update verification timestamp */
  async update(id, userId) {
    try {
      return await axios.put(
        `${base()}/verifications/${encodeURIComponent(id)}`,
        { id, userId },
        { headers, validateStatus: () => true },
      );
    } catch (err) {
      console.error("/requests/verifications.js update ERROR:", err);
      return null;
    }
  },

  /** After the user passes the verification puzzle, persist the verification record */
  async completeAfterCaptcha(userId) {
    const getRes = await module.exports.getByUserId(userId);
    const payload = getRes?.data?.value ?? getRes?.data;
    const verificationId = Array.isArray(payload)
      ? payload[0]?.id
      : payload?.id;
    if (getRes?.status === 200 && verificationId) {
      await module.exports.update(verificationId, userId);
    } else {
      await module.exports.create(userId);
    }
  },
};
