const { buildEmbed } = require("./embedUtil.js");
const { isValidString } = require("./stringUtil.js");

const ROLE_NOT_FOUND_MESSAGE =
  "Role Not Found: You must enter a valid server role.";

/**
 * Resolves a role by ID and returns member IDs that have it.
 * Sends error embed and returns null if role is invalid or not found.
 *
 * @param {object} interaction - Discord interaction
 * @param {string} roleId - Role ID (use "0" for none)
 * @param {string} commandKey - Command name for error embeds
 * @param {object} options
 * @param {boolean} options.excludeIssuer - If true, filter out interaction.user.id from userIdsWithRole
 * @param {boolean} options.normalizeGuildId - If true, treat roleId === guildId as "0"
 * @returns {Promise<{ role: object, userIdsWithRole: string[] }|null>}
 */
async function resolveRoleAndMemberIds(
  interaction,
  roleId,
  commandKey,
  options = {},
) {
  const { excludeIssuer = false, normalizeGuildId = true } = options;

  let resolvedRoleId = roleId;
  if (normalizeGuildId && roleId === interaction.guildId) {
    resolvedRoleId = "0";
  }

  if (!isValidString(resolvedRoleId)) {
    return { role: null, userIdsWithRole: null };
  }

  const guild = interaction.guild;
  const role =
    guild.roles.cache.get(resolvedRoleId) ||
    (await guild.roles.fetch(resolvedRoleId));

  if (!role) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "ERROR",
          description: ROLE_NOT_FOUND_MESSAGE,
          error: true,
        }),
      ],
    });
    return null;
  }

  let userIdsWithRole = guild.members.cache
    .filter((member) => member.roles.cache.has(role.id))
    .map((member) => member.id);

  if (excludeIssuer && userIdsWithRole.includes(interaction.user.id)) {
    userIdsWithRole = userIdsWithRole.filter((id) => id !== interaction.user.id);
  }

  return { role, userIdsWithRole };
}

module.exports = {
  resolveRoleAndMemberIds,
  ROLE_NOT_FOUND_MESSAGE,
};
