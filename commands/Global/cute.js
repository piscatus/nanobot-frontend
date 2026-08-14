const { SlashCommandBuilder } = require("@discordjs/builders");
const { formatRequestTitleMessage } = require("../../utils/commandUtil.js");
const {
  COLORS,
  EMOJIS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  COMMAND_OPTION_KEYS,
} = require("../../utils/constants.js");
const {
  formatCuteMessage,
  getAnimalDirectory,
  getFilteredFiles,
  getRandomInt,
} = require("../../utils/cuteUtil.js");
const {
  catchCommandException,
  catchMessageException,
  formatErrorTitle,
} = require("../../utils/errorUtil.js");
const { getInteractionContext } = require("../../utils/interactionUtil.js");
const {
  executeWithStatusCheck,
} = require("../../utils/statusUtil.js");
const { sendWithFile } = require("../../utils/channelUtil.js");
const { buildEmbed } = require("../../utils/embedUtil.js");
const { isValidString } = require("../../utils/stringUtil.js");
const path = require("path");
const mediaPath = path.join(__dirname, "..", "..", "cute");
const { execute: cute } = require("../../requests/cute.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_KEYS.CUTE)
    .setDescription(COMMAND_DESCRIPTIONS.CUTE)
    .addStringOption((option) =>
      option
        .setName(COMMAND_OPTION_KEYS.CATEGORY)
        .setDescription("Animal Category")
        .addChoices(
          { name: "Bird", value: "8" },
          { name: "Bunny", value: "7" },
          { name: "Cat", value: "6" },
          { name: "Dog", value: "5" },
          { name: "Duck", value: "4" },
          { name: "Frog", value: "3" },
          { name: "Rat", value: "2" },
          { name: "Turtle", value: "1" },
          { name: "Random", value: "0" },
        ),
    ),
  async execute(interaction, client) {
    try {
      const { guildId, userId } = getInteractionContext(interaction);
      const response = await executeWithStatusCheck(
        interaction,
        () => cute(guildId, userId),
        COMMAND_KEYS.CUTE,
      );
      if (!response) return;

      const animalType = interaction.options.getString("category") || "0";
      const dir = getAnimalDirectory(mediaPath, animalType);
      const files = getFilteredFiles(dir);

      if (files.length === 0) {
        return await interaction.editReply({
          embeds: [
            buildEmbed({
              title: formatErrorTitle(COMMAND_KEYS.CUTE),
              description:
                "No valid image files found in the " + dir + " directory.",
              error: true,
            }),
          ],
        });
      }

      const chosenFile = files[getRandomInt(0, files.length - 1)];

      if (interaction.guild) {
        const message = await sendWithFile(
          client,
          COMMAND_KEYS.CUTE,
          interaction.channelId,
          formatCuteMessage(interaction.user.id, response.data.commands),
          [path.join(dir, chosenFile)],
        );
        if (message === undefined || !isValidString(message.id)) {
          return await catchMessageException(interaction, COMMAND_KEYS.CUTE);
        }
      } else {
        await interaction.user.send({ files: [path.join(dir, chosenFile)] });
      }

      const EMBED_TITLE = formatRequestTitleMessage(
        EMOJIS.HEART_FACE,
        interaction.user.username,
        COMMAND_KEYS.CUTE,
      );

      const EMBED = buildEmbed({
        color: COLORS.NANOBOT_BLUE,
        title: EMBED_TITLE,
        description: `<@${userId}>'s ${COMMAND_KEYS.CUTE} request *successfully* completed!`,
      });

      await interaction.editReply({
        embeds: [EMBED],
        components: [],
      });
    } catch (err) {
      await catchCommandException(interaction, client, COMMAND_KEYS.CUTE, err);
    }
  },
};
