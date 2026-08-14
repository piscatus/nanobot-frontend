const { ActivityType } = require("discord.js");
const { execute: getCurrencies } = require("./getCurrencies.js");

let currentCurrencyIndexForPresence = 0;

module.exports = {
  async execute(client) {
    try {
      const currencies = await getCurrencies();
      const currencyList = currencies.data;

      if (!currencyList?.length) {
        return;
      }

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
