module.exports = (client) => {
  const sendFishingReminderCommand = require("../../jobs/sendFishingReminder.js");
  const sendMessagesCommand = require("../../jobs/sendMessages.js");
  const setStatusCommand = require("../../jobs/setStatus.js");

  async function updateStatus() {
    while (true) { // NOSONAR - intentional infinite loop for background task
      try {
        await setStatusCommand.execute(client);
      } catch (err) {
        console.error("ready.js updateStatus ERROR:", err);
      }
      await new Promise((resolve) => setTimeout(resolve, 60000));
      // Wait for 1 minute before executing the code again
    }
  }

  updateStatus();

  async function sendMessages() {
    while (true) { // NOSONAR - intentional infinite loop for background task
      try {
        await sendMessagesCommand.execute(client);
      } catch (err) {
        console.error("ready.js sendMessages ERROR", err);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Wait for 1 second before executing the code again
    }
  }

  sendMessages();

  async function sendReminder() {
    while (true) { // NOSONAR - intentional infinite loop for background task
      try {
        await sendFishingReminderCommand.execute(client);
      } catch (err) {
        console.error("ready.js sendReminder ERROR:", err);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Wait for 1 second before executing the code again
    }
  }

  sendReminder();
};
