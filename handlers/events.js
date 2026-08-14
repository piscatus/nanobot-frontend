const fs = require("fs");
module.exports = async (client) => {
  try {
    const load_dir = (dir) => {
      const event_files = fs
        .readdirSync(`./events/${dir}`)
        .filter((file) => file.endsWith(".js"));
      for (const file of event_files) {
        const event = require(`../events/${dir}/${file}`);
        let eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
      }
    };
    ["client"].forEach((e) => load_dir(e));
  } catch (err) {
    console.log("events.js ERROR", err);
  }
};
