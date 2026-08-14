const { execute: checkFishingReminder } = require("./checkFishingReminder.js");
const { execute: setRestless } = require("./setRestless.js");
const { sendWithEmbed } = require("../utils/channelUtil.js");
const {
  COLORS,
  NUMBERS,
  STATUS_CODES,
  TIME,
} = require("../utils/constants.js");
const {
  formatFishCommandMessage,
  formatFishReminderMessage,
} = require("../utils/fishUtil.js");
const { buildEmbed } = require("../utils/embedUtil.js");

module.exports = {
  async execute(client) {
    try {
      const result = await checkFishingReminder();

      if (!result?.data) {
        return;
      }

      const { data } = result;

      const {
        commands,
        allGuildConfigurations: configurations,
        anglers,
      } = data;

      for (const angler of anglers) {
        const config = configurations.find((c) => c.guildId === angler.guildId);
        if (!config) continue;

        const { fishingChannelId, fishingFrequency } = config;

        if (!fishingChannelId || fishingChannelId === "0") {
          await setRestless(angler.id);
          continue;
        }

        const frequencyMinutes =
          Number.isInteger(fishingFrequency) && fishingFrequency > 0
            ? fishingFrequency
            : NUMBERS.DEFAULT_FISHING_FREQUENCY;

        const minutesSinceLastFish =
          (Date.now() - new Date(angler.timestamp)) /
          (TIME.MILLISECONDS_PER_SECOND * TIME.SECONDS_PER_MINUTE);

        if (minutesSinceLastFish < frequencyMinutes) continue;

        const setRestlessResponse = await setRestless(angler.id);
        if (setRestlessResponse?.status !== STATUS_CODES.ACCEPTED) continue;

        await sendWithEmbed(
          client,
          "sendFishingReminder",
          fishingChannelId,
          formatFishReminderMessage(angler.userId),
          buildEmbed({
            color: COLORS.NANOBOT_BLUE,
            description: formatFishCommandMessage(commands),
          }),
        );
      }
    } catch (err) {
      console.error("sendFishingReminder.js ERROR:", err);
    }
  },
};
