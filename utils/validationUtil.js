const { buildEmbed } = require("./embedUtil.js");
const {
  COMMAND_OPTION_KEYS,
  NUMBERS,
} = require("./constants.js");
const {
  formatErrorTitle,
  sendCommandErrorEmbed,
} = require("./errorUtil.js");
const { sanitizeInput } = require("./stringUtil.js");

const INPUT_TOO_LONG_MESSAGE =
  "Invalid Input: The input is too long! Please limit it to " +
  NUMBERS.MAXIMUM_INPUT_LENGTH +
  " characters.";

const ADDRESS_TOO_LONG_MESSAGE =
  "Invalid Address: The address is too long! No supported currency uses an " +
  "address longer than " +
  NUMBERS.ADDRESS_LENGTH_MAXIMUM +
  " characters.";

async function validateInputLength(interaction, input, commandKey) {
  if (input.length <= NUMBERS.MAXIMUM_INPUT_LENGTH) return true;
  await sendCommandErrorEmbed(commandKey, INPUT_TOO_LONG_MESSAGE, interaction);
  return false;
}

async function validateAddress(interaction, address, commandKey) {
  if (address.length <= NUMBERS.ADDRESS_LENGTH_MAXIMUM) return true;
  await sendCommandErrorEmbed(commandKey, ADDRESS_TOO_LONG_MESSAGE, interaction);
  return false;
}

/**
 * Validates a numeric option (e.g. users, winners) with min/max and integer constraints.
 * @param {object} interaction - Discord interaction
 * @param {number|null} value - The value from getNumber()
 * @param {object} opts - Validation options
 * @param {number} opts.min - Minimum allowed value
 * @param {number} opts.max - Maximum allowed value
 * @param {string} opts.commandKey - Command key for error embeds
 * @param {string} opts.fieldName - Human-readable field name for error messages
 * @param {string} [opts.maxDescription] - Custom message when value > max
 * @param {string} [opts.minDescription] - Custom message when value < min
 * @param {string} [opts.wholeNumberDescription] - Custom message when value is not integer
 * @param {number} opts.defaultValue - Value to return when not provided (default 0)
 * @returns {Promise<number|null>} Resolved value or null if validation failed (reply already sent)
 */
async function validateNumericOption(interaction, value, opts) {
  const {
    min,
    max,
    commandKey,
    fieldName,
    maxDescription,
    minDescription,
    wholeNumberDescription,
    defaultValue = 0,
  } = opts;

  if (value == null) return defaultValue;

  const maxMsg = maxDescription ?? `${fieldName} cannot exceed ${max}!`;
  const minMsg = minDescription ?? `${fieldName} must be at least ${min}!`;
  const wholeMsg = wholeNumberDescription ?? `${fieldName} must be a whole number!`;

  if (value > max) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(commandKey),
          description: maxMsg,
          error: true,
        }),
      ],
    });
    return null;
  }
  if (value < min) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(commandKey),
          description: minMsg,
          error: true,
        }),
      ],
    });
    return null;
  }
  if (value % 1 !== 0) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: formatErrorTitle(commandKey),
          description: wholeMsg,
          error: true,
        }),
      ],
    });
    return null;
  }
  return value;
}

/**
 * Gets and validates string input from interaction. Returns null if validation fails.
 * @param {object} interaction - Discord interaction
 * @param {string} commandKey - Command key for error embeds
 * @param {string} [optionKey] - Option key (default: COMMAND_OPTION_KEYS.INPUT)
 * @returns {Promise<string|null>}
 */
async function getAndValidateInput(
  interaction,
  commandKey,
  optionKey = COMMAND_OPTION_KEYS.INPUT,
) {
  const input = sanitizeInput(
    interaction.options.getString(optionKey),
  );
  if (!(await validateInputLength(interaction, input, commandKey)))
    return null;
  return input;
}

module.exports = {
  getAndValidateInput,
  validateInputLength,
  validateAddress,
  validateNumericOption,
};
