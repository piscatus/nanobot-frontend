const BUTTON_DESCRIPTIONS = Object.freeze({
  CANCEL: "Cancel",
  CONFIRM: "Confirm",
  SEND_WHEN_READY: "Send as soon as possible",
});

const CHANNELS = Object.freeze({
  AIRDROPS: "airdrops",
  FISHING: "fishing",
  GENERAL: "general",
  IMAGES: "images",
  MEDIA: "media",
  OFF_TOPIC: "off-topic",
  SUPPORT: "support",
  SWAPS: "swaps",
  TIP_CHAT: "tip-chat",
  TRADES: "trades",
});

const COLORS = Object.freeze({
  ERROR_RED: "#FF0000",
  LIQUID_GREEN: "#28a745",
  NANOBOT_BLUE: "#21214C",
  RULES_RED: "#CF142B",
});

const COMMAND_KEYS = Object.freeze({
  ACTIVE: "active",
  ALIASES: "aliases",
  AUDIT: "audit",
  AWARD: "award",
  BONUSES: "bonuses",
  CONFIG: "config",
  CREATURES: "creatures",
  CURRENCIES: "currencies",
  CUTE: "cute",
  DEPOSIT: "deposit",
  DROP: "drop",
  FISH: "fish",
  GIFT: "gift",
  HELP: "help",
  INVENTORY: "inventory",
  LEADERBOARDS: "leaderboards",
  MERGE: "merge",
  PICKUP: "pickup",
  RAIN: "rain",
  RECEIVE: "receive",
  RESERVES: "reserves",
  ROLES: "roles",
  RULES: "rules",
  SALE: "sale",
  SELL: "sell",
  SEND: "send",
  SERVER: "server",
  TRANSACTIONS: "transactions",
  TRIVIA_ANSWER: "trivia",
  TRIVIADROP: "triviadrop",
  UPDATE: "update",
  WALLET: "wallet",
  WITHDRAW: "withdrawal",
});

/**
 * Button custom ids. The trivia prefix is followed by the 0-based index of the
 * answer pressed, e.g. "trivia:2"; the drop itself is identified by the message
 * the button sits on, exactly as the plain "pickup" button is.
 */
const CUSTOM_IDS = Object.freeze({
  PICKUP: "pickup",
  TRIVIA_ANSWER_PREFIX: "trivia:",
});

const COMMAND_DESCRIPTIONS = Object.freeze({
  ACTIVE: "Channel Activity",
  ALIASES: "Aliases List",
  AUDIT: "Audit Liquidity",
  AWARD: "Transfer Currencies and Creatures to Users with a Role",
  BONUSES: "Sale Multipliers List",
  CONFIG: "Configure the Server",
  CREATURES: "Creatures List",
  CURRENCIES: "Currencies List",
  CUTE: "Post a Cute Picture",
  DROP: "Transfer Currencies and Creatures to a Message",
  FISH: "Fish for Creatures",
  GIFT: "Transfer Currencies and Creatures to a User",
  HELP: "Help and Documentation",
  INVENTORY: "Creature Balances",
  LEADERBOARDS: "Server Fishing Leaderboards",
  MERGE: "Consolidate Subordinate Currencies and Creatures",
  PICKUP: "You Joined the Drop",
  RAIN: "Transfer Currencies and Creatures to Active Users",
  RECEIVE: "Deposit Addresses",
  RESERVES: "Server Fishing Reserves",
  ROLES: "Server Roles",
  RULES: "Server Rules",
  SELL: "Exchange Creatures for Currencies",
  SEND: "Wallet Withdrawal",
  SERVER: "Server Configurations",
  TRANSACTIONS: "User Transactions",
  TRIVIA_ANSWER: "Answer Locked In",
  TRIVIADROP: "Transfer Currencies and Creatures to a Trivia Question",
  UPDATE: "Update Deposit Address Representative",
  WALLET: "Currency Balances",
});

const COMMAND_OPTION_KEYS = Object.freeze({
  ACTIVITY_DURATION: "activity_duration",
  ADD_ALIAS: "add_alias",
  ADDRESS: "address",
  ALIAS_EMOJI: "alias_emoji",
  ALIAS_PLURAL: "alias_plural",
  ALIAS_SINGULAR: "alias_singular",
  ALIAS_VALUE: "alias_value",
  CATEGORY: "category",
  CHANNEL: "channel",
  CREATURE: "creature",
  CURRENCY: "currency",
  DIFFICULTY: "difficulty",
  DOCUMENTATION: "documentation",
  DURATION_MINUTES: "duration_minutes",
  DURATION_SECONDS: "duration_seconds",
  DURATION_HOURS: "duration_hours",
  DURATION_DAYS: "duration_days",
  FISHING_BYPASS_ROLE: "fishing_bypass_role",
  FISHING_CHANNEL: "fishing_channel",
  FISHING_ERROR_MESSAGE: "fishing_error_message",
  FISHING_FREQUENCY: "fishing_frequency",
  FISHING_LOGGING_CHANNEL: "fishing_logging_channel",
  FISHING_ROLE: "fishing_role",
  GLOBAL: "global",
  INPUT: "input",
  MESSAGE: "message",
  RANDOM: "random",
  REMOVE_ALIAS: "remove_alias",
  REVEAL: "reveal",
  ROLE: "role",
  SERVER: "server",
  TRANSFER_LOGGING_CHANNEL: "transfer_logging_channel",
  TYPE: "type",
  USER: "user",
  USERS_ACTIVE: "users_active",
  USERS: "users",
});

const COMMAND_OPTION_DESCRIPTIONS = Object.freeze({
  ADDRESS: "Enter Destination Address",
  ALIAS: "Enter an Alias",
  ALIAS_INPUT: "What is the value and currency?",
  ALIASES_GLOBAL: "Global Aliases List",
  ALIASES_SERVER: "Server Aliases List",
  AWARD_INPUT: "What are you awarding?",
  CHANNEL: "Select a Channel",
  CONFIG_ACTIVITY_DURATION: "Activity Duration",
  CONFIG_ADD_ALIAS: "Add Alias",
  CONFIG_FISHING_BYPASS_ROLE: "Fishing Bypass Role",
  CONFIG_FISHING_CHANNEL: "Fishing Channel",
  CONFIG_FISHING_ERROR_MESSAGE: "Fishing Error Message",
  CONFIG_FISHING_FREQUENCY: "Fishing Frequency",
  CONFIG_FISHING_LOGGING_CHANNEL: "Fishing Logging Channel",
  CONFIG_FISHING_ROLE: "Fishing Role",
  CONFIG_REMOVE_ALIAS: "Remove Alias",
  CONFIG_TRANSFER_LOGGING_CHANNEL: "Transfer Logging Channel",
  CONFIG_USERS_ACTIVE: "Users Active",
  DAYS: "Enter the Duration in Days",
  DAYS_ACTIVE: "Enter the Last Activity in Days",
  DOCUMENTATION: "Select Documentation",
  DROP_INPUT: "What are you dropping?",
  EMOJI: "Enter an Emoji",
  FISH_CURRENCY: "Set your default fishing currency for this server",
  GIFT_INPUT: "What are you gifting?",
  HOURS: "Enter the Duration in Hours",
  HOURS_ACTIVE: "Enter the Last Activity in Hours",
  LEADERBOARD_CREATURE: "Jump straight to one creature's leaderboard",
  LEADERBOARD_CURRENCY: "Only show creatures for one currency",
  MESSAGE: "Send as a Message?",
  MINUTES: "Enter the Duration in Minutes",
  MINUTES_ACTIVE: "Enter the Last Activity in Minutes",
  SECONDS: "Enter the Duration in Seconds",
  REVEAL: "Reveal private currency balances? (Bot Owner only)",
  RAIN_INPUT: "What are you raining?",
  RANDOM: "Enter a Random Number of Users",
  REPRESENTATIVE: "Enter Representative Address",
  ROLE: "Select a Role",
  SELL_INPUT: "What are you selling?",
  SEND_INPUT: "What are you withdrawing?",
  STRING: "Enter a Message",
  TRANSACTION_TYPE: "Only show one kind of transaction",
  TRIVIA_CATEGORY: "Pick a trivia category, or leave empty for any",
  TRIVIA_DIFFICULTY: "Pick a question difficulty, or leave empty for any",
  TRIVIA_WINNERS: "Enter the Maximum Number of Winners",
  TRIVIADROP_INPUT: "What are you dropping?",
  USERS: "Enter the Number of Users",
  USER: "Select a User",
});

const EMOJIS = Object.freeze({
  ADDRESS_PIN: "📌",
  ALIASES_GLOBE: "🌎",
  ALIASES_HOME: "🏠",
  AUDIT_NOTES: "📝",
  AWARD_TROPHY: "🏆",
  BACK_ARROW: "◀️",
  BANK_SERVER: "🏦",
  BLUE_HEART: "💙",
  CAMERA_FORWARD: "📷",
  CHAIN_HASH: "🔗",
  COMMAND_SATELLITE: "📡",
  CONFIG_WRENCH: "🔧",
  CREATURES_FISH: "🪝",
  CURRENCY_COIN: "💰",
  CYCLONE_SWAP: "🌀",
  DEAD_SKULL: "💀",
  DEPOSIT_INBOX: "📥",
  FASTFORWARD_ARROW: "⏭️",
  FIRM_HANDSHAKE: "🤝",
  FISHING_ROD: "🎣",
  FIST_BUMP: "🤜🤛",
  FORWARD_ARROW: "▶️",
  GIFT_PRESENT: "🎁",
  GUILD_CASTLE: "🏰",
  HEART_FACE: "🥰",
  INPUT_KEYBOARD: "⌨️",
  JOIN_DROP: "➕",
  INVENTORY_CABINET: "🗃️",
  LEVEL_ROLES: "🔰",
  LEVEL_CHARTS: "📊",
  MAN_RUNNING: "🏃",
  MONEY_BAGS: "💼",
  PARACHUTE_DROP: "🪂",
  PERSON_SHRUGGING: "🤷",
  RAIN_CLOUD: "🌧️",
  RANDOM_DICE: "🎲",
  RECEIVER_BULLSEYE: "🎯",
  REWIND_ARROW: "⏮️",
  RULES_ALARM: "🚨",
  ROLES_MASKS: "🎭",
  SALE_BONUS: "🛍️",
  SENDER_SILHOUETTE: "👤",
  SERVER_GEAR: "⚙️",
  SHOPPING_CART: "🛒",
  SPEECH_BUBBLE: "💬",
  SUBORDINATE: "👤",
  SUPPORT_ANIMAL: "🦮",
  SUPPORT_TICKET: "🎫",
  SYSTEM_COMPUTER: "🖥️",
  TELEVISION_MONITOR: "📺",
  TIMESTAMP_CLOCK: "🕒",
  TIMESTAMP_HOURGLASS: "⏳",
  TOTAL_CHART: "📶",
  TRANSACTION_LIST: "📝",
  TRIVIA_BRAIN: "🧠",
  TRIVIA_QUESTION: "❓",
  UNIQUE_ID: "🆔",
  UPDATE_REPRESENTATIVE: "🗳️",
  VERIFICATION_KEY: "🔑",
  VIP_DIAMOND: "💎",
  WATER_DROP: "💧",
  WITHDRAW_OUTGOING: "📨",
  WITHDRAW_RECEIPT: "🧾",
});

/** Sentinel for the unfiltered view, so it can share the filter's value slot. */
const FILTER_ALL = "all";

/**
 * Sentinel for "no currency preference", so it can share the ticker's value
 * slot on a /fish request. Picking it clears the user's saved default. Must
 * match Constants.TICKER_ANY in the API.
 */
const TICKER_ANY = "ANY";

/** Label for the {@link TICKER_ANY} choice, alongside "Name [TICKER]" ones. */
const TICKER_ANY_LABEL = "Any";

/** Discord rejects a select menu carrying more than 25 options. */
const MAXIMUM_SELECT_OPTIONS = 25;

/**
 * Difficulty choices for /triviadrop. Values match the `difficulty` stored on
 * trivia documents and Constants.TRIVIA_DIFFICULTIES in the API.
 */
const TRIVIA_DIFFICULTIES = Object.freeze([
  { name: "Easy", value: "easy" },
  { name: "Medium", value: "medium" },
  { name: "Hard", value: "hard" },
]);

/**
 * How often the trivia category list behind /triviadrop's autocomplete is
 * re-read from the API. Categories only appear once a question in them is
 * enabled, so this keeps a newly enabled set usable without a restart.
 */
const TRIVIA_CATEGORY_REFRESH_MILLISECONDS = 5 * 60 * 1000;

/**
 * The kinds of transaction the /transactions filter offers, in display order.
 *
 * <p>`value` is the command recorded on the transaction record; only these
 * commands write one today. A command missing from this list still gets a
 * generated entry from the user's history, so nothing becomes unreachable if a
 * new one starts recording transactions before it is added here.
 */
const TRANSACTION_FILTERS = Object.freeze([
  {
    value: COMMAND_KEYS.RECEIVE,
    label: "Deposits",
    emoji: EMOJIS.DEPOSIT_INBOX,
  },
  {
    value: COMMAND_KEYS.SEND,
    label: "Withdrawals",
    emoji: EMOJIS.WITHDRAW_OUTGOING,
  },
  { value: COMMAND_KEYS.FISH, label: "Fishing", emoji: EMOJIS.FISHING_ROD },
  { value: COMMAND_KEYS.SELL, label: "Sales", emoji: EMOJIS.SALE_BONUS },
  { value: COMMAND_KEYS.GIFT, label: "Gifts", emoji: EMOJIS.GIFT_PRESENT },
  { value: COMMAND_KEYS.RAIN, label: "Rains", emoji: EMOJIS.RAIN_CLOUD },
  { value: COMMAND_KEYS.DROP, label: "Drops", emoji: EMOJIS.PARACHUTE_DROP },
  {
    value: COMMAND_KEYS.TRIVIADROP,
    label: "Trivia Drops",
    emoji: EMOJIS.TRIVIA_BRAIN,
  },
  { value: COMMAND_KEYS.MERGE, label: "Merges", emoji: EMOJIS.CYCLONE_SWAP },
]);

const ROLES = Object.freeze({
  ATTO: "atto",
  FEMTO: "femto",
  LEVEL: "level",
  NANO: "nano",
  NYANO: "nyano",
  PICO: "pico",
  VIP: "vip",
  YOCTO: "yocto",
  ZEPTO: "zepto",
});

const STATUS_CODES = Object.freeze({
  ACCEPTED: 202,
  NO_CONTENT: 204,
  OK: 200,
});

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTES_PER_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;

const TIME = Object.freeze({
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY,
  MINUTES_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
});

/**
 * How long the filter and page controls stay live on a paginated embed. One
 * minute was not enough to read a page and decide where to go next, and the
 * point of a filter is to browse. Discord invalidates the interaction token at
 * fifteen minutes, so this stays well inside that.
 */
const BROWSE_WINDOW_MILLISECONDS =
  5 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

const DEFAULT_FISHING_FREQUENCY = 15;
const DEFAULT_MINUTES_ACTIVE = 30;
const DEFAULT_MINUTES_DROP = 30;
// Trivia drops are short on purpose: a long window is a search-engine window.
// Must match Constants.defaultTriviaDropDuration in the API.
const DEFAULT_MINUTES_TRIVIADROP = 3;
const DEFAULT_USERS_ACTIVE = 40;
// Outer bound across every supported currency, not a per-currency rule. Discord
// enforces setMaxLength client side, so this must fit the longest address any
// enabled currency can produce or that coin becomes impossible to withdraw to.
// Longest today is a Monero integrated address at 106; nano_ is 65, ban_ 64.
// The exact per-currency check is the length-anchored regex in the API.
const ADDRESS_LENGTH_MAXIMUM = 106;
const MAXIMUM_ALIAS_LENGTH = 50;
const MAXIMUM_DAYS_ACTIVE = 7;
const MAXIMUM_DAYS_FISHING = 7;
const MAXIMUM_DAYS_DROP = 7;
const MAXIMUM_HOURS_ACTIVE = MAXIMUM_DAYS_ACTIVE * TIME.HOURS_PER_DAY;
const MAXIMUM_HOURS_DROP = MAXIMUM_DAYS_DROP * TIME.HOURS_PER_DAY;
const MAXIMUM_HOURS_FISHING = MAXIMUM_DAYS_FISHING * TIME.HOURS_PER_DAY;
const MAXIMUM_INPUT_LENGTH = 200;
const MAXIMUM_MINUTES_ACTIVE = MAXIMUM_DAYS_ACTIVE * TIME.MINUTES_PER_DAY;
const MAXIMUM_MINUTES_DROP = MAXIMUM_DAYS_DROP * TIME.MINUTES_PER_DAY;
const MAXIMUM_MINUTES_FISHING = MAXIMUM_DAYS_FISHING * TIME.MINUTES_PER_DAY;
const MAXIMUM_MINUTES_TRIVIADROP = TIME.MINUTES_PER_HOUR;
// Discord allows five buttons per action row; one is kept spare.
const MAXIMUM_TRIVIA_ANSWERS = 4;
const MAXIMUM_USERS_ACTIVE = 40;
const MAXIMUM_USERS_DROP = 10000;
const MAXIMUM_USERS_RANDOM = 9999;
const MAXIMUM_USERS_TRIVIADROP = 10000;
const MINIMUM_DAYS_ACTIVE = 1;
const MINIMUM_DAYS_DROP = 1;
const MINIMUM_DAYS_FISHING = 1;
const MINIMUM_HOURS_ACTIVE = 1;
const MINIMUM_HOURS_DROP = 1;
const MINIMUM_HOURS_FISHING = 1;
const MINIMUM_MINUTES_ACTIVE = 1;
const MINIMUM_MINUTES_DROP = 1;
const MINIMUM_MINUTES_FISHING = 1;
const MINIMUM_MINUTES_TRIVIADROP = 1;
// Discord must not setMinValue(10): 2 minutes and 5 seconds is valid.
// The 10-second floor is enforced in JS only when minutes is not > 0.
const MINIMUM_SECONDS_TRIVIADROP = 10;
const MAXIMUM_SECONDS_TRIVIADROP = 59;
const MINIMUM_USERS_ACTIVE = 1;
const MINIMUM_USERS_DROP = 1;
const MINIMUM_USERS_RANDOM = 1;
const MINIMUM_USERS_TRIVIADROP = 1;

const PRIVILEGED_ROLE_IDS = [
  process.env.HOME_SERVER_OWNER_ROLE_ID,
  process.env.HOME_SERVER_ADMINISTRATOR_ROLE_ID,
  process.env.HOME_SERVER_MODERATOR_ROLE_ID,
];

const NUMBERS = Object.freeze({
  ADDRESS_LENGTH_MAXIMUM,
  DEFAULT_FISHING_FREQUENCY,
  DEFAULT_MINUTES_ACTIVE,
  DEFAULT_MINUTES_DROP,
  DEFAULT_MINUTES_TRIVIADROP,
  DEFAULT_USERS_ACTIVE,
  MAXIMUM_ALIAS_LENGTH,
  MAXIMUM_DAYS_ACTIVE,
  MAXIMUM_DAYS_DROP,
  MAXIMUM_DAYS_FISHING,
  MAXIMUM_HOURS_ACTIVE,
  MAXIMUM_HOURS_DROP,
  MAXIMUM_HOURS_FISHING,
  MAXIMUM_INPUT_LENGTH,
  MAXIMUM_MINUTES_ACTIVE,
  MAXIMUM_MINUTES_DROP,
  MAXIMUM_MINUTES_FISHING,
  MAXIMUM_MINUTES_TRIVIADROP,
  MAXIMUM_SECONDS_TRIVIADROP,
  MAXIMUM_TRIVIA_ANSWERS,
  MAXIMUM_USERS_ACTIVE,
  MAXIMUM_USERS_DROP,
  MAXIMUM_USERS_RANDOM,
  MAXIMUM_USERS_TRIVIADROP,
  MINIMUM_DAYS_ACTIVE,
  MINIMUM_DAYS_DROP,
  MINIMUM_DAYS_FISHING,
  MINIMUM_HOURS_ACTIVE,
  MINIMUM_HOURS_DROP,
  MINIMUM_HOURS_FISHING,
  MINIMUM_MINUTES_ACTIVE,
  MINIMUM_MINUTES_DROP,
  MINIMUM_MINUTES_FISHING,
  MINIMUM_MINUTES_TRIVIADROP,
  MINIMUM_SECONDS_TRIVIADROP,
  MINIMUM_USERS_ACTIVE,
  MINIMUM_USERS_DROP,
  MINIMUM_USERS_RANDOM,
  MINIMUM_USERS_TRIVIADROP,
});

module.exports = {
  BROWSE_WINDOW_MILLISECONDS,
  BUTTON_DESCRIPTIONS,
  CHANNELS,
  COLORS,
  CUSTOM_IDS,
  MAXIMUM_SELECT_OPTIONS,
  COMMAND_KEYS,
  PRIVILEGED_ROLE_IDS,
  COMMAND_DESCRIPTIONS,
  COMMAND_OPTION_KEYS,
  COMMAND_OPTION_DESCRIPTIONS,
  EMOJIS,
  FILTER_ALL,
  NUMBERS,
  ROLES,
  STATUS_CODES,
  TICKER_ANY,
  TICKER_ANY_LABEL,
  TIME,
  TRANSACTION_FILTERS,
  TRIVIA_CATEGORY_REFRESH_MILLISECONDS,
  TRIVIA_DIFFICULTIES,
};
