const { ActivityType } = require("discord.js");
const { execute: getCurrencies } = require("./getCurrencies.js");

let currentCurrencyIndexForPresence = 0;

module.exports = {
  async execute(client) {
    try {
      const currencies = await getCurrencies();
      // Disabled currencies are hidden everywhere else; keep them out of the
      // status too.
      const currencyList = (currencies.data ?? []).filter((c) => c.enabled);

      if (!currencyList.length) {
        return;
      }

      // Guard the index in case the enabled set shrank since the last tick.
      currentCurrencyIndexForPresence %= currencyList.length;
      const currency = currencyList[currentCurrencyIndexForPresence];

      await client.user.setPresence({
        activities: [
          {
            name: `/help | ${currency.ticker.toUpperCase()} $${currency.value}`,
            type: ActivityType.Playing,
          },
        ],
        status: "online",
      });

      currentCurrencyIndexForPresence =
        (currentCurrencyIndexForPresence + 1) % currencyList.length;
    } catch (err) {
      console.error("setStatus.js ERROR:", err);
    }
  },
};
