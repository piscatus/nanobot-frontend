const { EmbedBuilder } = require("discord.js");
const { EMOJIS, COLORS } = require("./constants.js");
const ERROR_COLOR = COLORS.ERROR_RED;

/** Discord rejects an embed carrying more than this many fields. */
const MAXIMUM_EMBED_FIELDS = 25;

/**
 * Clamps a field list to Discord's limit, replacing the last slot with a notice
 * so nothing is dropped silently.
 *
 * <p>Exceeding the limit fails the whole request, so a growing list - creatures,
 * aliases, a wallet gaining currencies - would take the command down entirely
 * rather than degrading. Currency filter buttons are the way to see a full list.
 */
function clampFields(fields) {
  if (!Array.isArray(fields) || fields.length <= MAXIMUM_EMBED_FIELDS) {
    return fields;
  }
  const kept = fields.slice(0, MAXIMUM_EMBED_FIELDS - 1);
  kept.push({
    name: `…and ${fields.length - (MAXIMUM_EMBED_FIELDS - 1)} more`,
    value: "> Use the currency filter buttons to view the rest.",
    inline: false,
  });
  return kept;
}

function buildEmbed(options = {}) {
  const { color, title, description, url, fields, footer, thumbnail, error } =
    options;

  const embed = new EmbedBuilder();

  if (error) {
    embed.setColor(ERROR_COLOR);

    if (title) {
      embed.setTitle(`${EMOJIS.DEAD_SKULL} ${title}`);
    }
  } else {
    if (color) embed.setColor(color);
    if (title) embed.setTitle(title);
  }

  if (description) embed.setDescription(description);
  if (url) embed.setURL(url);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (fields) embed.addFields(clampFields(fields));

  if (footer) {
    embed.setFooter({
      text: footer,
      iconURL: null,
    });
  }

  return embed;
}

module.exports = {
  buildEmbed,
};
