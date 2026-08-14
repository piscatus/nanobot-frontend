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

module.exports = {
  getInteractionContext,
};
