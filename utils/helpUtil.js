const { getCommandIds } = require("./commandUtil.js");
const {
  NUMBERS,
  COMMAND_OPTION_KEYS,
  COMMAND_KEYS,
} = require("./constants.js");
const {
  formatConfirmationRequirement,
  formatNetworkNotice,
  getCurrencyDecimalValue,
  getDecimalPlaces,
  getEffectiveMinimumWithdraw,
} = require("./currencyUtil.js");

function formatConfirmationMessage(type, dmContents = "their block hash") {
  return `-# Once the ${type} is confirmed and reflected on the network, users will receive a direct message with ${dmContents}.\n`;
}

function formatSpamMessage(type) {
  return `-# Avoid spamming the network with frequent ${type}, this feature is a privilege and can be revoked if necessary.`;
}

/**
 * Iterates enabled currencies and builds formatted minimum amount lines.
 * @param {Object} currencies - Map of ticker -> currency
 * @param {Object} commandMap - Command IDs for slash links
 * @param {function} getMinimum - (currency) => raw minimum value or null to skip
 * @param {function} formatLine - (currency, formatted, decimals) => string for each line
 */
function formatCurrencyMinimums(currencies, commandMap, getMinimum, formatLine) {
  let details = "";
  for (const key in currencies) {
    const c = currencies[key];
    if (!c.enabled || !c.precision || !c.ticker || !c.name) continue;
    const minVal = getMinimum(c);
    if (!minVal) continue;
    const formatted = getCurrencyDecimalValue(minVal, c.precision);
    const decimals = getDecimalPlaces(minVal, c.precision);
    details += formatLine(c, formatted, decimals);
  }
  return details;
}

function formatAwardsHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const awardDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => c.minimumRain,
    (c, formatted, decimals) =>
      `### The minimum </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> award amount for **${c.name.toUpperCase()}**:\n` +
      `**${formatted} ${c.ticker.toUpperCase()}** ${c.emoji}\n` +
      `(${decimals} decimal places)\n`,
  );

  return (
    `## Users can transfer an input amount of </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> items and </${COMMAND_KEYS.WALLET}:${
      commandMap[COMMAND_KEYS.WALLET]
    }> currencies to up to **${
      NUMBERS.MAXIMUM_USERS_ACTIVE
    }** users holding a role with </${COMMAND_KEYS.AWARD}:${
      commandMap[COMMAND_KEYS.AWARD]
    }>!\n` +
    awardDetails +
    `### The minimum </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> award amount:\n` +
    `**1 Creature**\n` +
    `(0 decimal places)\n\n` +
    `### Users can also utilize a configured list of \"shortcut\" currency values to include in their input, found in </${
      COMMAND_KEYS.ALIASES
    } ${COMMAND_OPTION_KEYS.GLOBAL}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }> and </${COMMAND_KEYS.ALIASES} ${COMMAND_OPTION_KEYS.SERVER}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }>.\n` +
    `### Here are some example commands:\n` +
    "- /award `role: @VIP` `input: $1 nano`\n" +
    "  - This will post an award of $1 worth of XNO for the users holding the @VIP role to share evenly\n" +
    "- /award `role: @Server Booster` `input: 69 Banano for the boosts!`\n" +
    "  - This will post an award of 69 BAN for users holding the @Server Booster role to share evenly\n" +
    "- /award `role: @Mod` `input: 100 sharks - to show appreciation to the mods`\n" +
    "  - This will post an award of 100 sharks for the users holding the @Mod role to share evenly\n\n" +
    "-# Try including a message at the end of the award input such as `input: 1 banano for you`!"
  );
}

/** Confirmation requirement line, empty when the currency does not specify one. */
function formatCurrencyConfirmations(currency) {
  const confirmations = formatConfirmationRequirement(currency);
  return confirmations ? `Credited after ${confirmations}\n` : "";
}

function formatDepositsHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const depositDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => c.minimumDeposit,
    (c, formatted, decimals) =>
      "### The minimum deposit amount for **" +
      c.name.toUpperCase() +
      "**:\n" +
      "**" +
      formatted +
      " " +
      c.ticker.toUpperCase() +
      "** " +
      c.emoji +
      "\n(" +
      decimals +
      " decimal places)\n" +
      // Settlement time differs sharply between networks - a single quorum
      // confirmation on Nano versus ten blocks on Monero - so it belongs
      // alongside the amount rather than buried in a generic note.
      formatCurrencyConfirmations(c) +
      "\n",
  );

  return (
    `## Users can deposit funds into their </${COMMAND_KEYS.WALLET}:${
      commandMap[COMMAND_KEYS.WALLET]
    }> with </${COMMAND_KEYS.RECEIVE}:${
      commandMap[COMMAND_KEYS.RECEIVE]
    }>!\n\n` +
    depositDetails +
    formatConfirmationMessage(
      "deposit",
      "their credited funds and block hash",
    ) +
    formatSpamMessage("deposits")
  );
}

function formatDropsHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const dropDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => c.minimumDrop,
    (c, formatted, decimals) =>
      `### The minimum </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> drop amount for **${c.name.toUpperCase()}**:\n` +
      `**${formatted} ${c.ticker.toUpperCase()}** ${c.emoji}\n` +
      `(${decimals} decimal places)\n`,
  );

  return (
    `## Users can leave an input amount of </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> creatures and </${COMMAND_KEYS.WALLET}:${
      commandMap[COMMAND_KEYS.WALLET]
    }> currencies in a channel for other users to claim with </${
      COMMAND_KEYS.DROP
    }:${commandMap[COMMAND_KEYS.DROP]}>!\n\n` +
    `### All drops have a duration of ${NUMBERS.DEFAULT_MINUTES_DROP} minutes, however:\n` +
    `If a duration is specified using the slash command option, drops can be anywhere from **1 minute** up to **7 days**!\n` +
    `### All users can participate in a drop, however:\n` +
    `If a user role requirement is specified using the slash command option, only users holding that role will be able to enter.\n` +
    `### Every user that enters a drop will receive an equal share of the drop after the duration has completed, however:\n` +
    `If the number of users is specified using the slash command option, only that number of users will allowed to enter the drop.\n` +
    `If the number of random users is specified using the slash command option, only that number of users will be randomly selected to receive an equal share of the drop.\n\n` +
    dropDetails +
    `### The minimum </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> drop amount:\n` +
    "**1 Creature**\n" +
    "(0 decimal places)\n\n" +
    `### Users can also utilize a configured list of "shortcut" currency values to include in their input, found in </${
      COMMAND_KEYS.ALIASES
    } ${COMMAND_OPTION_KEYS.GLOBAL}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }> and </${COMMAND_KEYS.ALIASES} ${COMMAND_OPTION_KEYS.SERVER}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }>.\n\n` +
    "### Here are some example commands:\n" +
    "- /drop `input: $1 Nano` `duration_days: 1`\n" +
    "  - This will leave a drop of $1 worth of XNO for 1 Day\n" +
    "- /drop `input: 2 small cakes` `users: 5`\n" +
    '  - This will leave a drop of 2 multiples of the alias "small" (0.002 XNO) for 30 Minutes for the first 5 Users\n' +
    "- /drop `input: 100 squids for hanging out in chat!` `duration_minutes: 5`\n" +
    "  - This will leave a drop of 100 squids for 5 Minutes\n" +
    "- /drop `input: 12.87 BAN + Bansplit`\n" +
    '  - This will leave a drop of 12.87 BAN in addition to 1 multiple of the alias "bansplit" (0.5 BAN) for a total of 13.37 BAN for 30 Minutes\n' +
    "- /drop `input: fish + nice day` `random: 1`\n" +
    '  - This will leave a drop of 1 fish in addition to 1 multiple of the alias "nice" (0.0069 XNO) with 1 Winner\n' +
    "- /drop `input: 0.5 XNO + 10 krakens` `role: @Mod`\n" +
    "  - This will leave a drop of 0.5 XNO in addition to 10 krakens for @Mod users for 30 Minutes\n\n" +
    "-# Try including a message at the end of the drop input such as `input: 1 xno for our VIPs`!"
  );
}

function formatTriviaDropsHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const dropDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => c.minimumDrop,
    (c, formatted, decimals) =>
      `### The minimum </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> trivia drop amount for **${c.name.toUpperCase()}**:\n` +
      `**${formatted} ${c.ticker.toUpperCase()}** ${c.emoji}\n` +
      `(${decimals} decimal places)\n`,
  );

  return (
    `## Users can leave an input amount of </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> creatures and </${COMMAND_KEYS.WALLET}:${
      commandMap[COMMAND_KEYS.WALLET]
    }> currencies in a channel attached to a trivia question with </${
      COMMAND_KEYS.TRIVIADROP
    }:${commandMap[COMMAND_KEYS.TRIVIADROP]}>!\n\n` +
    `### All trivia drops last **${NUMBERS.DEFAULT_MINUTES_TRIVIADROP} minutes**, however:\n` +
    `If \`duration_minutes\` is specified, trivia drops can be anywhere from **${NUMBERS.MINIMUM_MINUTES_TRIVIADROP} minute** up to **${NUMBERS.MAXIMUM_MINUTES_TRIVIADROP} minutes**!\n` +
    `If \`duration_seconds\` is specified without minutes, the drop lasts **${NUMBERS.MINIMUM_SECONDS_TRIVIADROP}–${NUMBERS.MAXIMUM_SECONDS_TRIVIADROP} seconds**. Seconds under **${NUMBERS.MINIMUM_SECONDS_TRIVIADROP}** are allowed when \`duration_minutes\` is also set.\n` +
    `### Anyone can answer a trivia drop, however:\n` +
    `There is no role requirement and no random-winner option. The 2–4 answers appear only on buttons, never in the embed. Each user may lock in **one** answer, and the reply does not say whether it was right.\n` +
    `### The first users to press the correct answer share the drop evenly when it ends, however:\n` +
    `If \`users\` is specified, that number is the **maximum number of winners**, not a cap on how many people may answer.\n` +
    `The drop ends when the timer runs out, or as soon as that many correct answers have been locked in.\n` +
    `If nobody answers correctly, the reward is returned to the dropper.\n` +
    `An optional \`category\` picks the question bank; leave it empty for a question from any category. An optional \`difficulty\` of \`easy\`, \`medium\`, or \`hard\` can be set the same way; leave it empty for any.\n\n` +
    dropDetails +
    `### The minimum </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> trivia drop amount:\n` +
    "**1 Creature**\n" +
    "(0 decimal places)\n\n" +
    `### Users can also utilize a configured list of "shortcut" currency values to include in their input, found in </${
      COMMAND_KEYS.ALIASES
    } ${COMMAND_OPTION_KEYS.GLOBAL}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }> and </${COMMAND_KEYS.ALIASES} ${COMMAND_OPTION_KEYS.SERVER}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }>.\n\n` +
    "### Here are some example commands:\n" +
    "- /triviadrop `input: 1 ban`\n" +
    "  - This will leave a 3-minute trivia drop of 1 BAN. Anyone may answer; correct answers share it when it ends\n" +
    "- /triviadrop `input: $1 Nano` `category: Science` `duration_minutes: 5`\n" +
    "  - This will leave a 5-minute Science trivia drop of $1 worth of XNO\n" +
    "- /triviadrop `input: 1 ban` `duration_seconds: 30`\n" +
    "  - This will leave a 30-second trivia drop of 1 BAN\n" +
    "- /triviadrop `input: 1 ban` `category: Science` `difficulty: hard`\n" +
    "  - This will leave a 3-minute hard Science trivia drop of 1 BAN\n" +
    "- /triviadrop `input: 10 sharks` `users: 3`\n" +
    "  - This will leave a 3-minute trivia drop of 10 sharks for the first 3 correct answers to share. The drop can end early once those winner slots are filled\n\n" +
    "-# Try including a message at the end of the trivia drop input such as `input: 1 banano for the smart ones`!"
  );
}

function formatFishingHelp(commands) {
  const commandMap = getCommandIds(commands);
  return (
    `## Users can catch currency-themed creatures and add them to their </${
      COMMAND_KEYS.INVENTORY
    }:${commandMap[COMMAND_KEYS.INVENTORY]}> with </${COMMAND_KEYS.FISH}:${
      commandMap[COMMAND_KEYS.FISH]
    }>!\n` +
    `### Each server that hosts <@${process.env.BOT_USER_ID}> contributes their own funds for fishing.\n` +
    `### Users can </fish:${
      commandMap[COMMAND_KEYS.FISH]
    }> from any channel within a server, however:\n` +
    `A channel showcasing completed catches and notifying users when they can fish again can be confugred by a server administrator with </${
      COMMAND_KEYS.CONFIG
    } ${COMMAND_OPTION_KEYS.FISHING_CHANNEL}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>\n` +
    `### When users decide to </${COMMAND_KEYS.SELL}:${
      commandMap[COMMAND_KEYS.SELL]
    }> their creatures, the sale value will be transferred to their </${
      COMMAND_KEYS.WALLET
    }:${commandMap[COMMAND_KEYS.WALLET]}>.\n\n` +
    `### Users can </${COMMAND_KEYS.FISH}:${
      commandMap[COMMAND_KEYS.FISH]
    }> every **15** minutes, however:\n` +
    `A custom duration can be configured by a server adminitrator with </${
      COMMAND_KEYS.CONFIG
    } ${COMMAND_OPTION_KEYS.FISHING_FREQUENCY}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>.\n` +
    `### All server members can </${COMMAND_KEYS.FISH}:${
      commandMap[COMMAND_KEYS.FISH]
    }> by default, however:\n` +
    `A required role can be configured by a server administrator with </${
      COMMAND_KEYS.CONFIG
    } ${COMMAND_OPTION_KEYS.FISHING_ROLE}:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>.\n` +
    `### Creatures have hard-coded chances of being caught and non-changing sale values, however:\n` +
    `Bulk sale bonus multipliers (up to 2x) are available and outlined in the </${
      COMMAND_KEYS.BONUSES
    }:${commandMap[COMMAND_KEYS.BONUSES]}> guide.\n` +
    `## Server Owners:\n` +
    `### After this bot has been added to a server, </fish:${
      commandMap[COMMAND_KEYS.FISH]
    }> will be enabled once the server </reserves:${
      commandMap[COMMAND_KEYS.RESERVES]
    }> contain at least 0.02 Nano **or** 20 Banano, however:\n` +
    `Server fishing </reserves:${
      commandMap[COMMAND_KEYS.RESERVES]
    }> can be contributed by **anyone** using </gift:${
      commandMap[COMMAND_KEYS.GIFT]
    }> within that server, simply transfer currencies or creatures to <@${
      process.env.BOT_USER_ID
    }>.\n` +
    `### The **maximum** sale value of a creature (2x) will be deducted from the server's </${
      COMMAND_KEYS.RESERVES
    }:${commandMap[COMMAND_KEYS.RESERVES]}> at the time it is caught.\n` +
    `### Other optional fishing configuration features to consider:\n` +
    `- With </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.FISHING_BYPASS_ROLE
    }:${
      commandMap[COMMAND_KEYS.CONFIG]
    }> one or more roles are set that can circumvent the required fishing role.\n` +
    `- With </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.FISHING_ERROR_MESSAGE
    }:${
      commandMap[COMMAND_KEYS.CONFIG]
    }> an error message is set to be displayed for users when they do not have the configured required fishing role or a bypass role.`
  );
}

function formatGiftHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const giftDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => c.minimumGift,
    (c, formatted, decimals) =>
      `### The minimum </wallet:${
        commandMap[COMMAND_KEYS.WALLET]
      }> gift amount for **${c.name.toUpperCase()}**:\n` +
      `**${formatted} ${c.ticker.toUpperCase()}** ${c.emoji}\n` +
      `(${decimals} decimal places)\n`,
  );

  return (
    `## Users can transfer an input amount of </inventory:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> creatures and </wallet:${
      commandMap[COMMAND_KEYS.WALLET]
    }> currencies to a user with </gift:${commandMap[COMMAND_KEYS.GIFT]}>!\n` +
    giftDetails +
    `### The minimum </inventory:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> gift amount:\n` +
    `**1 Creature**\n` +
    `(0 decimal places)\n\n` +
    `### Users can also utilize a configured list of "shortcut" currency values to include in their input, found in </${
      COMMAND_KEYS.ALIASES
    } ${COMMAND_OPTION_KEYS.GLOBAL}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }> and </${COMMAND_KEYS.ALIASES} ${COMMAND_OPTION_KEYS.SERVER}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }>.\n` +
    `### Here are some example commands:\n` +
    "- /gift `user: @feeless` `input: $0.01 nano`\n" +
    "  - This will post a gift of $0.01 worth of XNO for @feeless\n" +
    "- /gift `user: @feeless` `input: 2 nice of you!`\n" +
    '  - This will post a gift of 2 multiples of the alias "nice" (0.0138 XNO) for @feeless\n' +
    "- /gift `user: @feeless` `input: 100 sharks`\n" +
    "  - This will post a gift of 100 shark for @feeless\n\n" +
    "-# Try including a message at the end of the gift input such as `input: 1 banano for you`!"
  );
}

function formatShareCommandList(commandMap) {
  const commands = [];
  if (process.env.GUILD_INTENTS_GRANTED === "true") {
    commands.push(
      `</${COMMAND_KEYS.AWARD}:${commandMap[COMMAND_KEYS.AWARD]}>`,
    );
  }
  commands.push(
    `</${COMMAND_KEYS.DROP}:${commandMap[COMMAND_KEYS.DROP]}>`,
    `</${COMMAND_KEYS.GIFT}:${commandMap[COMMAND_KEYS.GIFT]}>`,
    `</${COMMAND_KEYS.RAIN}:${commandMap[COMMAND_KEYS.RAIN]}>`,
  );
  if (commands.length === 1) {
    return commands[0];
  }
  return `${commands.slice(0, -1).join(", ")} and ${commands[commands.length - 1]}`;
}

function formatGeneralHelp(commands) {
  const commandMap = getCommandIds(commands);

  return (
    "## Nanobot is a feature-rich Discord bot that gives every user their own wallet to collect and share currencies with friends and family. Transfers between users are feeless; on-chain withdrawals follow each network's fees.\n" +
    `### Users can use <@${process.env.BOT_USER_ID}>'s slash (/) commands through direct message or within any server that hosts Nanobot.\n` +
    `### With this bot, users can easily </${COMMAND_KEYS.RECEIVE}:${commandMap[COMMAND_KEYS.RECEIVE]}> and </${COMMAND_KEYS.SEND}:${commandMap[COMMAND_KEYS.SEND]}> currencies from their </wallet:${commandMap[COMMAND_KEYS.WALLET]}> to on-chain addresses.\n` +
    `### Currencies can be shared with ${formatShareCommandList(commandMap)} in any channel on Discord!\n` +
    `### Currencies can also be shared in your server through an interactive faucet, enabling the users in your server to </${COMMAND_KEYS.FISH}:${commandMap[COMMAND_KEYS.FISH]}> for currency-themed creatures!\n` +
    `### To vote for our bot and help grow our community, visit https://top.gg/bot/${process.env.BOT_USER_ID}.\n` +
    `### To invite our bot to a server, visit ${process.env.BOT_INVITE_URL}.\n` +
    `-# To learn more about this bot or to view our Terms of Service or Privacy Policy, visit ${process.env.WEBSITE_URL}.`
  );
}

function formatRainHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const rainDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => c.minimumRain,
    (c, formatted, decimals) =>
      `### The minimum </wallet:${
        commandMap[COMMAND_KEYS.WALLET]
      }> rain amount for **${c.name.toUpperCase()}**:\n` +
      `**${formatted} ${c.ticker.toUpperCase()}** ${c.emoji}\n` +
      `(${decimals} decimal places)\n`,
  );

  return (
    `## Users can distribute an input amount of </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> creatures and </${COMMAND_KEYS.WALLET}:${
      commandMap[COMMAND_KEYS.WALLET]
    }> currencies to all </${COMMAND_KEYS.ACTIVE}:${
      commandMap[COMMAND_KEYS.ACTIVE]
    }> users in a channel with </${COMMAND_KEYS.RAIN}:${
      commandMap[COMMAND_KEYS.RAIN]
    }>!\n\n` +
    `### All rains are distributed to users active in the last ${NUMBERS.DEFAULT_MINUTES_ACTIVE} minutes by default, however:\n` +
    `If a duration is specified using the slash command option, rains can be anywhere from **1 minute** up to **7 days**!\n` +
    `If a duration is configured in a server using </${COMMAND_KEYS.CONFIG} ${
      COMMAND_OPTION_KEYS.ACTIVITY_DURATION
    }:${
      commandMap[COMMAND_KEYS.CONFIG]
    }>, rains will default to that duration.\n` +
    `### All active users will be eligible for a rain, however:\n` +
    `If a user role requirement is specified using the slash command option, only active users holding that role will receive an equal share of the rain.\n` +
    `If the number of users is specified using the slash command option, only that number of most recently active users will receive an equal share of the rain.\n` +
    `If the number of random users is specified using the slash command option, only that number of active users will be randomly selected to receive an equal share of the rain.\n\n` +
    rainDetails +
    `### The minimum </inventory:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> rain amount:\n` +
    "**1 Creature**\n" +
    "(0 decimal places)\n\n" +
    `### Users can also utilize a configured list of "shortcut" currency values to include in their input, found in </${
      COMMAND_KEYS.ALIASES
    } ${COMMAND_OPTION_KEYS.GLOBAL}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }> and </${COMMAND_KEYS.ALIASES} ${COMMAND_OPTION_KEYS.SERVER}:${
      commandMap[COMMAND_KEYS.ALIASES]
    }>.\n\n` +
    "Here are some example commands:\n" +
    "- /rain `input: $0.01 xno`\n" +
    "  - This will post a rain of $0.01 worth of XNO for active users to share evenly\n" +
    "- /rain `input: 1 penguin` `random: 1` `duration_minutes: 5`\n" +
    "  - This will post a rain of 1 penguin for 1 random active user in the last 5 minutes\n" +
    "- /rain `input: 100 micro` `role: @Yocto`\n" +
    '  - This will post a rain of 100 multiples of the alias "micro" (0.01 XNO) for active users holding the @Yocto role to share evenly\n' +
    "- /rain `input: 20 whales + 1 BAN` `users: 5`\n" +
    "  - This will post a rain of 20 whales in addition to 1 BAN for the 5 most recently active users to share evenly\n\n" +
    "-# Try including a message at the end of the rain input such as `input: .1 nano to share with friends`!"
  );
}

function formatSalesHelp(commands) {
  const commandMap = getCommandIds(commands);
  return (
    `## Users can exchange an input amount of creatures in their </${
      COMMAND_KEYS.INVENTORY
    }:${commandMap[COMMAND_KEYS.INVENTORY]}> for currencies for their </${
      COMMAND_KEYS.WALLET
    }:${commandMap[COMMAND_KEYS.WALLET]}> with </${COMMAND_KEYS.SELL}:${
      commandMap[COMMAND_KEYS.SELL]
    }>.\n` +
    `### The minimum </${COMMAND_KEYS.INVENTORY}:${
      commandMap[COMMAND_KEYS.INVENTORY]
    }> sale amount:\n` +
    "**1 Creature**\n" +
    "(0 decimal places)" +
    "\n\n" +
    "### Here are some example commands:\n" +
    "- /sell `input: all turtles`\n" +
    "  - This will sell all turtles\n" +
    "- /sell `input: 50 shrimp + 25 lobsters`\n" +
    "  - This will sell 50 shrimp in addition to 25 lobsters\n" +
    "- /sell `input: all creatures`\n" +
    "  - This will sell all creatures\n\n" +
    `-# Bulk sale bonus multipliers (up to 2x) are available and outlined in the </${
      COMMAND_KEYS.BONUSES
    }:${commandMap[COMMAND_KEYS.BONUSES]}> guide.`
  );
}

function formatSupportHelp() {
  return (
    "## Users can join our Discord server for inquiries and support help.\n\n" +
    `### Server members have access to our <#${process.env.SUPPORT_CHANNEL_ID}> channel to request assistance, troubleshoot command interactions, deletion of user data and more.\n\n` +
    `${process.env.HOME_SERVER_INVITE_URL}\n\n` +
    `-# In the event of a Discord outage or technical issues with joining our server, please reach out to our team directly at ${process.env.EMAIL_URL}`
  );
}

function formatUpdatesHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  const representativeNames = [];
  const settlementLines = [];
  for (const key in currencies ?? {}) {
    const c = currencies[key];
    if (c?.enabled && c.name && c.supportsRepresentative !== false) {
      representativeNames.push(c.name);
      const confirmations = formatConfirmationRequirement(c);
      if (confirmations) {
        settlementLines.push(`**${c.name}** settles after ${confirmations}.`);
      }
    }
  }
  const representativeNote =
    representativeNames.length > 0
      ? `### Representative updates apply to ${representativeNames.join(
          ", ",
        )}. Currencies without a representative cannot use this command.\n`
      : "";
  const settlementNote =
    settlementLines.length > 0 ? `${settlementLines.join("\n")}\n` : "";

  return (
    `## Users can update the representative of their </${
      COMMAND_KEYS.RECEIVE
    }:${commandMap[COMMAND_KEYS.RECEIVE]}> address with </${
      COMMAND_KEYS.UPDATE
    }:${commandMap[COMMAND_KEYS.UPDATE]}>.\n` +
    representativeNote +
    settlementNote +
    "### Here are some example commands:\n" +
    "- /update `address: nano_3kmnt...`\n" +
    "  - This will update the representative of your Nano deposit address to nano_3knmt...\n" +
    "- /update `address: ban_3knmt...`\n" +
    "  - This will update the representative of your Banano deposit address to ban_3knmt...\n" +
    formatConfirmationMessage("update") +
    formatSpamMessage("updates")
  );
}

function formatWithdrawalsHelp(commands, currencies) {
  const commandMap = getCommandIds(commands);
  // The fee is deducted from the amount sent, so the amount a user must clear is
  // the configured minimum plus the current fee estimate. Quoting the bare
  // minimumWithdraw would advertise a figure the network cannot actually settle.
  const withdrawDetails = formatCurrencyMinimums(
    currencies,
    commandMap,
    (c) => getEffectiveMinimumWithdraw(c),
    (c, formatted, decimals) =>
      `### The minimum </${COMMAND_KEYS.WALLET}:${
        commandMap[COMMAND_KEYS.WALLET]
      }> withdraw amount for **${c.name.toUpperCase()}**:\n` +
      `**${formatted} ${c.ticker.toUpperCase()}** ${c.emoji}\n` +
      `(${decimals} decimal places)\n` +
      // Same fee and settlement copy as /currencies: on a chain with fees the
      // recipient gets less than the requested amount.
      formatNetworkNotice(c) +
      "\n",
  );

  return (
    `## Users can withdraw an input amount of currency from their </${
      COMMAND_KEYS.WALLET
    }:${commandMap[COMMAND_KEYS.WALLET]}> to an on-chain address with </${
      COMMAND_KEYS.SEND
    }:${commandMap[COMMAND_KEYS.SEND]}>.\n` +
    `${withdrawDetails}\n` +
    "Here are some example commands:\n" +
    "- /send `input: $5 xno` `address: nano_3kmnt...`\n" +
    "  - This will send $5 worth of Nano on-chain to nano_3knmt...\n" +
    "- /send `input: all banano` `address: ban_3knmt...`\n" +
    "  - This will send all of your Banano on-chain to ban_3knmt...\n" +
    "- /send `input: 0.1 xno` `address: nano_3kmnt...`\n" +
    "  - This wil send 0.1 Nano on-chain to nano_3knmt...\n\n" +
    formatConfirmationMessage("withdrawal") +
    formatSpamMessage("withdrawals")
  );
}

module.exports = {
  formatAwardsHelp,
  formatDepositsHelp,
  formatDropsHelp,
  formatTriviaDropsHelp,
  formatFishingHelp,
  formatGiftHelp,
  formatGeneralHelp,
  formatRainHelp,
  formatSalesHelp,
  formatSupportHelp,
  formatUpdatesHelp,
  formatWithdrawalsHelp,
};
