const { ROLES } = require("./constants.js");

function formatLevelRolesMessage() {
  return (
    `## Levels are a fun way to show your activity in the server. You can gain levels by chatting!\n\n` +
    `### Low effort or repeated messages are considered spam and against server rules.\n\n` +
    `### **List of Level Role Benefits**\n` +
    `- <@&${process.env.HOME_SERVER_NANO_ROLE_ID}> | **Level 100**\n` +
    `  - <:${ROLES.NANO}:${process.env.HOME_SERVER_NANO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n` +
    `- <@&${process.env.HOME_SERVER_NYANO_ROLE_ID}> | **Level 80**\n` +
    `  - <:${ROLES.NYANO}:${process.env.HOME_SERVER_NYANO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n` +
    `- <@&${process.env.HOME_SERVER_PICO_ROLE_ID}> | **Level 60**\n` +
    `  - <:${ROLES.PICO}:${process.env.HOME_SERVER_PICO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n` +
    `- <@&${process.env.HOME_SERVER_FEMTO_ROLE_ID}> | **Level 45**\n` +
    `  - <:${ROLES.FEMTO}:${process.env.HOME_SERVER_FEMTO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n` +
    `- <@&${process.env.HOME_SERVER_ATTO_ROLE_ID}> | **Level 30**\n` +
    `  - <:${ROLES.ATTO}:${process.env.HOME_SERVER_ATTO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n` +
    `- <@&${process.env.HOME_SERVER_ZEPTO_ROLE_ID}> | **Level 15**\n` +
    `  - <:${ROLES.ZEPTO}:${process.env.HOME_SERVER_ZEPTO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n` +
    `- <@&${process.env.HOME_SERVER_YOCTO_ROLE_ID}> | **Level 5**\n` +
    `  - <:${ROLES.YOCTO}:${process.env.HOME_SERVER_YOCTO_ROLE_EMOJI_ID}> Role, Role Icon, and Display Name Color\n\n` +
    `-# Check your current level in <#${process.env.BOT_SPAM_CHANNEL_ID}> using </level:${process.env.LEVEL_COMMAND_ID}>`
  );
}


function formatVipRoleMessage() {
  return (
    `## Our community helps promote our server.\n\n` +
    `### You can connect your Discord account and upvote our Discord server:\n` +
    `Vote [here](https://blockmap.one/c/nanogiveaway/vote)! ` +
    `(https://blockmap.one/c/nanogiveaway/vote)\n\n` +
    `### **List of <@&${process.env.HOME_SERVER_VIP_ROLE_ID}> Role Benefits** <:vip:${process.env.HOME_SERVER_VIP_ROLE_EMOJI_ID}>\n` +
    `- Airdrops Channel (<#${process.env.AIRDROPS_CHANNEL_ID}>) **View Access**\n` +
    `- Fishing Channel (<#${process.env.FISHING_CHANNEL_ID}>) **Fishing Access**`
  );
}

module.exports = {
  formatLevelRolesMessage,
  formatVipRoleMessage,
};
