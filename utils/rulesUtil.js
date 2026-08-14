const { getCommandIds } = require("./commandUtil.js");
const {
  EMOJIS,
  CHANNELS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
} = require("./constants.js");

function formatRulesMap(commands) {
  return {
    10: {
      title: `${
        EMOJIS.RULES_ALARM
      } ${COMMAND_DESCRIPTIONS.RULES.toUpperCase()} ${EMOJIS.RULES_ALARM}`,
      desc: formatServerRulesMessage(),
    },
    9: {
      title: `${
        EMOJIS.SUPPORT_TICKET
      } #${CHANNELS.SUPPORT.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatSupportRulesMessage(),
    },
    8: {
      title: `${
        EMOJIS.SPEECH_BUBBLE
      } #${CHANNELS.GENERAL.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatGeneralRulesMessage(commands),
    },
    7: {
      title: `${
        EMOJIS.PERSON_SHRUGGING
      } #${CHANNELS.OFF_TOPIC.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatOfftopicRulesMessage(commands),
    },
    6: {
      title: `${
        EMOJIS.CAMERA_FORWARD
      } #${CHANNELS.IMAGES.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatImagesRulesMessage(commands),
    },
    5: {
      title: `${
        EMOJIS.TELEVISION_MONITOR
      } #${CHANNELS.MEDIA.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatMediaRulesMessage(commands),
    },
    4: {
      title: `${
        EMOJIS.RAIN_CLOUD
      } #${CHANNELS.TIP_CHAT.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatTipchatRulesMessage(commands),
    },
    3: {
      title: `${
        EMOJIS.PARACHUTE_DROP
      } #${CHANNELS.AIRDROPS.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatAirdropRulesMessage(),
    },
    2: {
      title: `${
        EMOJIS.FISHING_ROD
      } #${CHANNELS.FISHING.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatFishingRulesMessage(),
    },
    1: {
      title: `${
        EMOJIS.CYCLONE_SWAP
      } #${CHANNELS.SWAPS.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatSwapsRulesMessage(),
    },
    0: {
      title: `${
        EMOJIS.FIRM_HANDSHAKE
      } #${CHANNELS.TRADES.toUpperCase()} ${COMMAND_KEYS.RULES.toUpperCase()} ${
        EMOJIS.RULES_ALARM
      }`,
      desc: formatTradesRulesMessage(commands),
    },
  };
}

function formatServerRulesMessage() {
  return (
    "## Breaking any of the server or channel rules will result in a warning, mute, or ban depending on past behavior and the severity of the offense." +
    "\n\n" +
    "### Rules for *all* channels!" +
    "\n\n" +
    "- Be Kind.\n" +
    "- No Begging.\n" +
    "- English Only.\n" +
    "- No Caps Lock.\n" +
    "- No Spamming.\n" +
    "- No Advertising.\n" +
    "- No Harassment.\n" +
    "- No URLs / Links.\n" +
    "- No NSFW Content.\n" +
    "- No Self-Promotion.\n" +
    "- No Financial Advice.\n" +
    "- No Unsolicited DMs.\n" +
    "- No Duplicate Accounts.\n" +
    "- No Political Discussions.\n" +
    "- No Religious Discussions.\n" +
    "- No Account Impersonation." +
    "\n\n" +
    "-# Please refer to the channel-specific rules before posting!"
  );
}

function formatSupportRulesMessage() {
  return (
    "## Get help with the server or <@" +
    process.env.BOT_USER_ID +
    ">!" +
    "\n\n" +
    "### Rules for the <#" +
    process.env.SUPPORT_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    "- **No** calling-out other users. " +
    "Please reach out to an Administrator or Moderator directly.\n" +
    "- **No** mentioning <@&" +
    process.env.HOME_SERVER_OWNER_ROLE_ID +
    ">, <@&" +
    process.env.HOME_SERVER_ADMINISTRATOR_ROLE_ID +
    "> or <@&" +
    process.env.HOME_SERVER_MODERATOR_ROLE_ID +
    "> except for emergencies!\n" +
    "- **Never** waste our time, serious inquiries only." +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatGeneralRulesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    "## Topical discussions are encouraged!" +
    "\n\n" +
    "### Rules for the <#" +
    process.env.GENERAL_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    `- **No** bot commands, except </${COMMAND_KEYS.GIFT}:` +
    commandMap[COMMAND_KEYS.GIFT] +
    ">!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatOfftopicRulesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    "## Non-topical discussions are encouraged!" +
    "\n\n" +
    "### Rules for the <#" +
    process.env.OFF_TOPIC_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    `- **No** bot commands, except </${COMMAND_KEYS.GIFT}:` +
    commandMap[COMMAND_KEYS.GIFT] +
    ">!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatImagesRulesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    "## **Giphy** and **Imgur** links are allowed here." +
    "\n\n" +
    "### Rules for the <#" +
    process.env.IMAGES_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    `- **No** bot commands, except </${COMMAND_KEYS.GIFT}:` +
    commandMap[COMMAND_KEYS.GIFT] +
    ">!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatMediaRulesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    "## **SoundCloud**, **Spotify**, **Vimeo**, and **YouTube** links are allowed here." +
    "\n\n" +
    "### Rules for the <#" +
    process.env.MEDIA_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    `- **No** bot commands, except </${COMMAND_KEYS.GIFT}:` +
    commandMap[COMMAND_KEYS.GIFT] +
    ">!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatTipchatRulesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    "## Rains and chatting are encouraged!" +
    "\n\n" +
    "### Rules for the <#" +
    process.env.TIP_CHAT_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    "- **Never send low effort messages to stay active!**\n" +
    "-# Low effort messages include but are not limited to single words, repeated emoji-only messages, repeated GIF-only messages, and repeated brief content.\n" +
    "- **No** bot commands, except </airdrop:" +
    process.env.AIRDROP_COMMAND_ID +
    `>, </${COMMAND_KEYS.DROP}:` +
    commandMap[COMMAND_KEYS.DROP] +
    `>, </${COMMAND_KEYS.GIFT}:` +
    commandMap.gift +
    `>, </${COMMAND_KEYS.RAIN}:` +
    commandMap.rain +
    ">, and </tip:" +
    process.env.TIP_COMMAND_ID +
    ">!\n" +
    "- The value of the </airdrop:" +
    process.env.AIRDROP_COMMAND_ID +
    `>, </${COMMAND_KEYS.DROP}:` +
    commandMap[COMMAND_KEYS.DROP] +
    `>, </${COMMAND_KEYS.GIFT}:` +
    commandMap[COMMAND_KEYS.GIFT] +
    `>, </${COMMAND_KEYS.RAIN}:` +
    commandMap[COMMAND_KEYS.RAIN] +
    ">, and </tip:" +
    process.env.TIP_COMMAND_ID +
    "> commands can be **no less than $0.00001**.\n" +
    "-# Balance checks can only be executed via direct message with the bots or in the ⁠<#" +
    process.env.BOT_SPAM_CHANNEL_ID +
    "> channel!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatAirdropRulesMessage() {
  return (
    "## Drops and reactions to user drops are encouraged!" +
    "\n\n" +
    "### Rules for the <#" +
    process.env.AIRDROPS_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    "- **No** Talking 🤫 - **Airdrops Only!**\n" +
    "- **No** *Low-Value* airdrops - Drop values must be $0.01 or greater in value\n" +
    "- **No** *Short-Duration* airdrops - Time must be 3 minutes (default) or longer" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatFishingRulesMessage() {
  return (
    "## Reactions to user catches are encouraged!" +
    "\n\n" +
    "### Rules for the <#" +
    process.env.FISHING_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    "- <@" +
    process.env.BOT_USER_ID +
    "> Slash Commands *Only*" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatSwapsRulesMessage() {
  return (
    "## Swap at your own discretion! " +
    "This server is not responsible for any financial loss you may incur inside or outside this server." +
    "\n\n" +
    "### Rules for the <#" +
    process.env.SWAPS_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    "- Swaps can ONLY be executed by with </swap:" +
    process.env.NANSWAP_SWAP_ID +
    "> or </swap-feeless:" +
    process.env.NANSWAP_FEELESS_SWAP_ID +
    "> using <@" +
    process.env.NANSWAP_BOT_ID +
    ">\n" +
    "- If the <@" +
    process.env.NANSWAP_BOT_ID +
    "> bot does not behave as expected, you can request support at " +
    process.env.NANSWAP_SERVER_INVITE_URL +
    "\n" +
    "- If you are unable to gain resolution using support from above, please let us know in the <#" +
    process.env.SUPPORT_CHANNEL_ID +
    "> channel!\n" +
    "- **No** chatting, swap commands only, please!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

function formatTradesRulesMessage(commands) {
  const commandMap = getCommandIds(commands);
  return (
    "## Trade at your own discretion! " +
    "This server is not responsible for any financial loss you may incur inside or outside this server." +
    "\n\n" +
    "### Rules for the <#" +
    process.env.TRADES_CHANNEL_ID +
    "> channel:" +
    "\n\n" +
    "- Trades must be agreed on by both parties! This includes an *obvious* **offer** and an *obvious* **acceptance**!\n" +
    "- Use the format [W] Banano [H] XNO when *making offers*.\n" +
    "- If an agreed deal was **broken**, please let us know in the <#" +
    process.env.SUPPORT_CHANNEL_ID +
    "> channel!\n" +
    `- **No** bot commands, except </${COMMAND_KEYS.GIFT}:` +
    commandMap[COMMAND_KEYS.GIFT] +
    ">, </tip:" +
    process.env.TIP_COMMAND_ID +
    ">, `$tip` and `$bals`!\n" +
    "- **No** balance checks in this channel unless you are proposing a trade!" +
    "\n\n" +
    "-# Server rules must be followed in *all* channels!"
  );
}

module.exports = {
  formatRulesMap,
  formatServerRulesMessage,
  formatSupportRulesMessage,
  formatGeneralRulesMessage,
  formatOfftopicRulesMessage,
  formatImagesRulesMessage,
  formatMediaRulesMessage,
  formatTipchatRulesMessage,
  formatAirdropRulesMessage,
  formatFishingRulesMessage,
  formatSwapsRulesMessage,
  formatTradesRulesMessage,
};
