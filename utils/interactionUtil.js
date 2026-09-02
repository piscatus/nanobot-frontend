/**
 * Extracts common context from a Discord interaction.
 * @param {object} interaction - Discord interaction
 * @returns {{ guildId: string|null, channelId: string|null, userId: string|null }}
 */
function getInteractionContext(interaction) {
  return {
    guildId: interaction.guildId ?? null,
    channelId: interaction.channelId ?? null,
    userId: interaction.user?.id ?? null,
  };
}

/**
 * Discord errors that mean the interaction can no longer be replied to.
 * 10062 is an expired or unknown token; 40060 is one already acknowledged.
 */
const DEAD_INTERACTION_CODES = new Set([10062, 40060]);

/**
 * Acknowledges a component interaction, tolerating a token that has expired.
 *
 * <p>Interaction tokens expire, so a user clicking a stale button is routine
 * rather than exceptional. Left unhandled, the rejection terminates the Node
 * process and takes the bot offline for every guild until it restarts, so this
 * must never throw.
 *
 * @returns {Promise<boolean>} true when the interaction was acknowledged and is
 *   still safe to edit; false when the caller should give up on it.
 */
async function safeDeferUpdate(interaction) {
  try {
    await interaction.deferUpdate();
    return true;
  } catch (err) {
    if (DEAD_INTERACTION_CODES.has(err?.code)) {
      return false;
    }
    console.error("interactionUtil.js safeDeferUpdate ERROR:", err);
    return false;
  }
}

module.exports = {
  getInteractionContext,
  safeDeferUpdate,
};
