function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Sanitizes user input: trims whitespace and collapses multiple spaces.
 * @param {string} input - Raw input string
 * @returns {string}
 */
function sanitizeInput(input) {
  return (input || "").trim().replace(/ +(?= )/g, "");
}

function isValidString(data) {
  return data !== null && data !== undefined && data !== "" && data !== "0";
}

/**
 * Formats an array of user IDs (or objects with getId) as "User1, User2 and User3".
 * @param {Array} items - Array of user IDs or objects
 * @param {function} [getId] - Optional getter for ID, e.g. (u) => u.userId. Default: identity.
 * @returns {string}
 */
function formatUserMentions(items, getId = (x) => x) {
  return items
    .map((item, index, arr) => {
      const id = getId(item);
      const userMention = `<@${id}>`;
      if (index === arr.length - 1) return userMention;
      if (index === arr.length - 2) return `${userMention} and`;
      return `${userMention},`;
    })
    .join(" ");
}

module.exports = {
  capitalize,
  formatUserMentions,
  isValidString,
  sanitizeInput,
};
