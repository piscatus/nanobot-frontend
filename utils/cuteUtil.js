const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getCommandIds } = require("./commandUtil.js");
const { COMMAND_KEYS } = require("./constants.js");

const validExtensions = [".jpg", ".png"];
const animalDirectories = {
  8: "bird",
  7: "bunny",
  6: "cat",
  5: "dog",
  4: "duck",
  3: "frog",
  2: "rat",
  1: "turtle"
};

function getRandomInt(min, max) {
  if (min > max) {
    throw new RangeError(
      "Invalid range: min should be less than or equal to max.",
    );
  }
  const range = max - min + 1;
  if (range <= 0) {
    throw new RangeError("Range must be positive.");
  }
  return min + crypto.randomInt(range);
}

function getAnimalDirectory(mediaPath, animalType) {
  if (animalType === "0") {
    const keys = Object.keys(animalDirectories);
    const randomKey = keys[getRandomInt(0, keys.length - 1)];
    return path.join(mediaPath, animalDirectories[randomKey]);
  }
  return path.join(mediaPath, animalDirectories[animalType]);
}

function getFilteredFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) =>
      validExtensions.includes(path.extname(file).toLowerCase()),
    );
}

function formatCuteMessage(userId, commands) {
  const commandMap = getCommandIds(commands);
  return `<@${userId}> left a </${COMMAND_KEYS.CUTE}:${
    commandMap[COMMAND_KEYS.CUTE]
  }> image!`;
}

module.exports = {
  formatCuteMessage,
  getAnimalDirectory,
  getFilteredFiles,
  getRandomInt,
};
