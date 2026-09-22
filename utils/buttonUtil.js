const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const { BUTTON_DESCRIPTIONS, COLORS, EMOJIS, TIME } = require("./constants.js");
const { buildEmbed } = require("./embedUtil.js");
const { formatErrorTitle } = require("./errorUtil.js");
const { safeDeferUpdate } = require("./interactionUtil.js");

function shuffleCaptchaEmojis(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ensureVerificationCaptchaMaps(client) {
  if (!client.verificationCaptchaPuzzles) {
    client.verificationCaptchaPuzzles = new Map();
  }
  if (!client.verificationCaptchaButtons) {
    client.verificationCaptchaButtons = new Map();
  }
}

/** Drops one puzzle and its button lookup rows (each button customId is a unique uuid). */
function cleanupVerificationCaptchaPuzzle(client, puzzleId) {
  const puzzle = client.verificationCaptchaPuzzles?.get(puzzleId);
  if (!puzzle) {
    return;
  }
  for (const bid of puzzle.buttonIds) {
    client.verificationCaptchaButtons?.delete(bid);
  }
  client.verificationCaptchaPuzzles.delete(puzzleId);
}

async function confirmationCollectorCreator(
  interaction,
  interactionReply,
  uniqueConfirmId,
  uniqueCancelId,
) {
  const filter = (i) =>
    (i.customId === uniqueConfirmId || i.customId === uniqueCancelId) &&
    i.user.id === interaction.user.id;

  const collector = interactionReply.createMessageComponentCollector({
    filter,
    time: TIME.SECONDS_PER_MINUTE * TIME.MILLISECONDS_PER_SECOND,
    max: 1,
  });

  return new Promise((resolve) => {
    collector.on("collect", async (i) => {
      if (i.customId === uniqueConfirmId) {
        resolve(true);
      } else if (i.customId === uniqueCancelId) {
        resolve(false);
      }
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        resolve(false);
      }
    });
  });
}

async function swapCollectorCreator(
  client,
  interaction,
  interactionReply,
  homeButton,
  subordinateButton,
  color,
  alternativeColor,
  homeTitle,
  homeTextContent,
  homeContent,
  homeList,
  homeRow,
  subordinateTitle,
  subordinateTextContent,
  subordinateContent,
  subordinateList,
  subRow,
) {
  const filter = (i) =>
    (i.customId === homeButton || i.customId === subordinateButton) &&
    i.user.id === interaction.user.id;

  const collector = interactionReply.createMessageComponentCollector({
    filter,
    time: TIME.SECONDS_PER_MINUTE * TIME.MILLISECONDS_PER_SECOND,
  });

  collector.on("collect", async (i) => {
    const userId = i.user.id;
    const cooldownExpiry = client.buttonCooldowns.get(userId);
    if (cooldownExpiry && Date.now() < cooldownExpiry) return;

    client.buttonCooldowns.set(userId, Date.now() + 1000);
    if (!(await safeDeferUpdate(i))) return;

    if (i.customId === homeButton) {
      currentEmbed = buildEmbed({
        color: color,
        title: homeTitle,
        description: homeContent,
        fields: homeList,
      });
      currentRow = subRow;
      currentText = homeTextContent;
    } else if (i.customId === subordinateButton) {
      currentEmbed = buildEmbed({
        color: alternativeColor,
        title: subordinateTitle,
        description: subordinateContent,
        fields: subordinateList,
      });
      currentRow = homeRow;
      currentText = subordinateTextContent;
    }

    await interaction.editReply({
      content: currentText,
      embeds: [currentEmbed],
      components: [currentRow],
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
}

exports.swap = async function (
  interaction,
  client,
  color,
  alternativeColor,
  homeTitle,
  homeTextContent,
  homeContent,
  homeList,
  subordinateTitle,
  subordinateTextContent,
  subordinateContent,
  subordinateList,
) {
  let uniqueHomeId = uuidv4();
  let uniqueSubordinateId = uuidv4();

  const homeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(uniqueHomeId)
      .setLabel(homeTitle)
      .setStyle(ButtonStyle.Secondary),
  );

  const subRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(uniqueSubordinateId)
      .setLabel(subordinateTitle)
      .setStyle(ButtonStyle.Secondary),
  );

  let currentEmbed = buildEmbed({
    color: color,
    title: homeTitle,
    description: homeContent,
    fields: homeList,
  });
  let currentRow = subRow;
  let currentText = homeTextContent;

  const interactionReply = await interaction.editReply({
    content: currentText,
    embeds: [currentEmbed],
    components: [currentRow],
    fetchReply: true,
  });

  await swapCollectorCreator(
    client,
    interaction,
    interactionReply,
    uniqueHomeId,
    uniqueSubordinateId,
    color,
    alternativeColor,
    homeTitle,
    homeTextContent,
    homeContent,
    homeList,
    homeRow,
    subordinateTitle,
    subordinateTextContent,
    subordinateContent,
    subordinateList,
    subRow,
  );
};

const CAROUSEL_BUTTONS_PER_ROW = 5;
const CAROUSEL_MAXIMUM_PANELS = 25;

/**
 * Paged embed with one button per page. Unlike swap, which toggles between
 * exactly two panels, this scales to any number of currencies, so adding a coin
 * does not require touching the UI.
 *
 * @param {Array<{title: string, color: string, content: string, textContent?: string, list?: object, url?: string}>} panels
 */
exports.carousel = async function (interaction, client, panels) {
  const pages = panels.slice(0, CAROUSEL_MAXIMUM_PANELS);
  if (pages.length === 0) return;

  const buildPageEmbed = (page) =>
    buildEmbed({
      color: page.color,
      title: page.title,
      description: page.content,
      fields: page.list,
      url: page.url,
    });

  if (pages.length === 1) {
    return interaction.editReply({
      content: pages[0].textContent ?? null,
      embeds: [buildPageEmbed(pages[0])],
      components: [],
    });
  }

  const buttonIds = pages.map(() => uuidv4());

  const buildRows = (activeIndex) => {
    const rows = [];
    for (
      let start = 0;
      start < pages.length;
      start += CAROUSEL_BUTTONS_PER_ROW
    ) {
      const row = new ActionRowBuilder().addComponents(
        pages
          .slice(start, start + CAROUSEL_BUTTONS_PER_ROW)
          .map((page, offset) => {
            const index = start + offset;
            return new ButtonBuilder()
              .setCustomId(buttonIds[index])
              .setLabel(page.label ?? page.title)
              .setStyle(
                index === activeIndex
                  ? ButtonStyle.Primary
                  : ButtonStyle.Secondary,
              )
              .setDisabled(index === activeIndex);
          }),
      );
      rows.push(row);
    }
    return rows;
  };

  const render = (index) => ({
    content: pages[index].textContent ?? null,
    embeds: [buildPageEmbed(pages[index])],
    components: buildRows(index),
  });

  const interactionReply = await interaction.editReply({
    ...render(0),
    fetchReply: true,
  });

  const buttonIdSet = new Set(buttonIds);
  const collector = interactionReply.createMessageComponentCollector({
    filter: (i) =>
      buttonIdSet.has(i.customId) && i.user.id === interaction.user.id,
    time: TIME.SECONDS_PER_MINUTE * TIME.MILLISECONDS_PER_SECOND,
  });

  collector.on("collect", async (i) => {
    const cooldownExpiry = client.buttonCooldowns.get(i.user.id);
    if (cooldownExpiry && Date.now() < cooldownExpiry) return;
    client.buttonCooldowns.set(i.user.id, Date.now() + 1000);
    if (!(await safeDeferUpdate(i))) return;

    const index = buttonIds.indexOf(i.customId);
    if (index < 0) return;
    await interaction.editReply(render(index));
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
};

exports.confirm = async function (interaction, command, embed, labels = {}) {
  try {
    let uniqueConfirmId = uuidv4();
    let uniqueCancelId = uuidv4();
    const confirmLabel =
      labels.confirmLabel || BUTTON_DESCRIPTIONS.CONFIRM;
    const cancelLabel = labels.cancelLabel || BUTTON_DESCRIPTIONS.CANCEL;

    const interactionReply = await interaction.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(uniqueConfirmId)
            .setLabel(confirmLabel)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(uniqueCancelId)
            .setLabel(cancelLabel)
            .setStyle(ButtonStyle.Danger),
        ),
      ],
      fetchReply: true,
    });

    if (
      await confirmationCollectorCreator(
        interaction,
        interactionReply,
        uniqueConfirmId,
        uniqueCancelId,
      )
    ) {
      return true;
    } else {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            color: embed.data.color,
            title: embed.data.title,
            description: "Your " + command + " has been **cancelled**!",
          }),
        ],
        components: [],
        ephemeral: true,
      });
      return false;
    }
  } catch (err) {
    console.error(
      command.toUpperCase() + " confirmationUtil.js confirm Error:",
      err,
    );
    return false;
  }
};

const CAPTCHA_TIME_MS =
  TIME.SECONDS_PER_MINUTE * TIME.MILLISECONDS_PER_SECOND;

/**
 * Ephemeral emoji puzzle: each puzzle gets a new puzzleId and four unique button
 * customIds (uuid), same pattern as confirm/cancel. Concurrent puzzles do not
 * share map entries or customIds.
 */
exports.sendVerificationCaptchaPuzzle = async function (
  interaction,
  client,
  userId,
  emojisList,
  options,
) {
  const { commandKey, onCaptchaSuccess } = options;
  if (typeof onCaptchaSuccess !== "function") {
    throw new TypeError("sendVerificationCaptchaPuzzle: onCaptchaSuccess is required");
  }

  if (!Array.isArray(emojisList) || emojisList.length < 4) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(commandKey),
          description:
            "Verification puzzle could not be loaded (not enough emojis). Please try again later.",
          error: true,
        }),
      ],
    });
    return;
  }

  const shuffled = shuffleCaptchaEmojis(emojisList);
  const target = shuffled[0];
  const distractors = shuffled.slice(1, 4);
  const choices = shuffleCaptchaEmojis([target, ...distractors]);

  ensureVerificationCaptchaMaps(client);

  const puzzleId = uuidv4();
  const buttonIds = [];

  const row = new ActionRowBuilder().addComponents(
    choices.map((emoji) => {
      const buttonId = uuidv4();
      buttonIds.push(buttonId);
      client.verificationCaptchaButtons.set(buttonId, {
        puzzleId,
        emojiId: emoji.id,
      });
      return new ButtonBuilder()
        .setCustomId(buttonId)
        .setLabel(emoji.emoji || emoji.name || emoji.id)
        .setStyle(ButtonStyle.Secondary);
    }),
  );

  client.verificationCaptchaPuzzles.set(puzzleId, {
    userId,
    targetId: target.id,
    buttonIds,
  });

  const targetName =
    target.name || (target.emoji ? `${target.emoji}` : "the emoji");

  const verificationEmbed = buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: `${EMOJIS.VERIFICATION_KEY} ${interaction.user.username}'s Verification Request`,
    description: `Please select the **${targetName}** emoji to continue.`,
  });

  let message;
  try {
    message = await interaction.editReply({
      embeds: [verificationEmbed],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });
  } catch (err) {
    cleanupVerificationCaptchaPuzzle(client, puzzleId);
    throw err;
  }

  const buttonIdSet = new Set(buttonIds);

  const filter = (i) =>
    i.user.id === userId && buttonIdSet.has(i.customId);

  const collector = message.createMessageComponentCollector({
    filter,
    time: CAPTCHA_TIME_MS,
    max: 1,
  });

  collector.on("collect", async (i) => {
    const link = client.verificationCaptchaButtons?.get(i.customId);
    const puzzle = link
      ? client.verificationCaptchaPuzzles?.get(link.puzzleId)
      : null;
    if (
      !link ||
      !puzzle ||
      puzzle.userId !== i.user.id ||
      link.puzzleId !== puzzleId
    ) {
      await i.deferUpdate().catch(() => {});
      return;
    }

    const correct = link.emojiId === puzzle.targetId;
    cleanupVerificationCaptchaPuzzle(client, puzzleId);

    if (!correct) {
      await i.update({
        embeds: [
          buildEmbed({
            color: COLORS.ERROR_RED,
            title: `${interaction.user.username}'s Verification Request`,
            description:
              "You selected the wrong emoji. Please try again.",
            error: true,
          }),
        ],
        components: [],
      });
      return;
    }
    await onCaptchaSuccess(i, client);
  });

  collector.on("end", async (collected) => {
    if (collected.size > 0) return;
    cleanupVerificationCaptchaPuzzle(client, puzzleId);
    try {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            color: verificationEmbed.data.color,
            title: verificationEmbed.data.title,
            description: "Your verification has been **cancelled**!",
          }),
        ],
        components: [],
      });
    } catch (e) {}
  });
};
