const { EmbedBuilder } = require("discord.js");
const { EMOJIS, COLORS } = require("./constants.js");
const ERROR_COLOR = COLORS.ERROR_RED;

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
  if (fields) embed.addFields(fields);

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
