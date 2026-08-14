const { Client, Collection, IntentsBitField } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");

const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 37, EXPONENTIAL_AT: 38 });

const slashCommandCooldown = 1000; // one second
const buttonCommandCooldown = 1000; // one second
const fetchedGuilds = new Set();

const {
  COLORS,
  EMOJIS,
  COMMAND_DESCRIPTIONS,
  COMMAND_KEYS,
  STATUS_CODES,
} = require("./utils/constants.js");
const { sendVerificationCaptchaPuzzle } = require("./utils/buttonUtil.js");
const { buildEmbed } = require("./utils/embedUtil.js");
const { formatErrorTitle } = require("./utils/errorUtil.js");
const { execute: setActivity } = require("./jobs/setActivity.js");
const { execute: setCommands } = require("./jobs/setCommands.js");
const { execute: joinDrop } = require("./requests/pickup.js");
const verificationsApi = require("./requests/verifications.js");
const { checkStatuses } = require("./utils/statusUtil.js");
async function deployCommands() {
  const rest = new REST({ version: "9" }).setToken(process.env.BOT_USER_SECRET);

  const serverCommands = [];
  const serverCommandFiles = fs
    .readdirSync("./commands/Server")
    .filter((file) => file.endsWith(".js"));

  for (const file of serverCommandFiles) {
    const command = require("./commands/Server/" + file);
    serverCommands.push(command.data.toJSON());
  }

  if (serverCommands.length > 0) {
    (async () => {
      try {
        console.log("Started refreshing application (/) SERVER commands.");

        const data = await rest.put(
          Routes.applicationGuildCommands(
            process.env.BOT_USER_ID,
            process.env.HOME_SERVER_ID,
          ),
          { body: serverCommands },
        );

        data.forEach((entry) => {
          entry.commandId = entry.id;
          delete entry.id;
        });

        console.log("Setting API commands list...");
        const success = await setCommands(data);

        if (success) {
          console.log("Successfully reloaded application (/) SERVER commands.");
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }

  const globalCommands = [];
  const globalCommandFiles = fs
    .readdirSync("./commands/Global")
    .filter((file) => file.endsWith(".js"));

  for (const file of globalCommandFiles) {
    if (
      process.env.GUILD_INTENTS_GRANTED === "true" ||
      file.toLowerCase() !== "award.js"
    ) {
      const command = require("./commands/Global/" + file);
      globalCommands.push(command.data.toJSON());
    }
  }

  if (globalCommands.length > 0) {
    (async () => {
      try {
        console.log("Started refreshing application (/) GLOBAL commands.");

        const data = await rest.put(
          Routes.applicationCommands(process.env.BOT_USER_ID),
          {
            body: globalCommands,
          },
        );

        data.forEach((entry) => {
          entry.commandId = entry.id;
          delete entry.id;
        });

        console.log("Setting API commands list...");
        const success = await setCommands(data);

        if (success) {
          console.log("Successfully reloaded application (/) GLOBAL commands.");
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }
}

function setCooldown(collection, userId, cooldownTime) {
  const expiryTime = Date.now() + cooldownTime;
  collection.set(userId, expiryTime);
}

function cleanUpExpiredCooldowns(collection) {
  const now = Date.now();
  for (const [userId, expiryTime] of collection.entries()) {
    if (now > expiryTime) {
      collection.delete(userId); // Remove expired entry
    }
  }
}

async function initialize() {
  const COOLDOWN_CHECK_INTERVAL = 60000; // Check every minute for expired cooldowns

  setInterval(() => {
    cleanUpExpiredCooldowns(client.cooldowns);
    cleanUpExpiredCooldowns(client.buttonCooldowns);
  }, COOLDOWN_CHECK_INTERVAL);

  console.log("Creating Client...");
  const intents = [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
  ];

  if (process.env.GUILD_INTENTS_GRANTED === "true") {
    intents.push(IntentsBitField.Flags.GuildMembers);
  }

  const client = new Client({
    messageCacheLifetime: 60,
    fetchAllMembers: false,
    intents: intents,
    messageCacheMaxSize: 10,
    restTimeOffset: 0,
    disableEveryone: true,
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
  });

  client.commands = new Collection();
  console.log("Setting client commands list...");
  let commandFiles = fs
    .readdirSync("./commands/Global/")
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    if (
      process.env.GUILD_INTENTS_GRANTED === "true" ||
      file.toLowerCase() !== "award.js"
    ) {
      const command = require("./commands/Global/" + file);
      client.commands.set(command.data.name, command);
    }
  }

  commandFiles = fs
    .readdirSync("./commands/Server/")
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require("./commands/Server/" + file);
    client.commands.set(command.data.name, command);
  }

  console.log("Telling Discord about the commands...");
  await deployCommands();

  console.log("Starting events handler...");
  ["events"].forEach((handler) => {
    require(`./handlers/${handler}`)(client);
  });

  client.cooldowns = new Collection();
  client.buttonCooldowns = new Collection();

  console.log("Watching for interactions...");
  client.on("interactionCreate", async (interaction) => {
    try {
      const guild = interaction.guild;
      const userId = interaction.user.id;

      // Fetch members ONLY the first time this guild runs this command
      if (
        process.env.GUILD_INTENTS_GRANTED === "true" &&
        interaction.guild &&
        !fetchedGuilds.has(guild.id)
      ) {
        try {
          await guild.members.fetch();
          fetchedGuilds.add(guild.id);
        } catch (err) {
          return await interaction.editReply({
            embeds: [
              buildEmbed({
                title: "ERROR",
                description:
                  "Could not fetch server members. Please try again!",
                error: true,
              }),
            ],
            components: [],
            ephemeral: true,
          });
        }
      }

      // Check for button interactions
      if (interaction.isButton()) {
        if (interaction.customId === "pickup") {
          const cooldownExpiry = client.buttonCooldowns.get(userId);
          if (cooldownExpiry && Date.now() < cooldownExpiry) {
            return await interaction.reply({
              content: `<@${userId}>, please wait one second between collecting drops.`,
              ephemeral: true,
            });
          }

          setCooldown(client.buttonCooldowns, userId, buttonCommandCooldown);

          await interaction.deferReply({ ephemeral: true });

          const dropMessageId = interaction.message?.id ?? null;
          const roleIds =
            interaction.member.roles.cache.map((r) => r.id) ?? null;

          const checkResponse = await verificationsApi.check(userId);

          if (checkResponse?.status !== 200) {
            const emojisList = Array.isArray(checkResponse?.data)
              ? checkResponse.data
              : null;

            if (!emojisList || emojisList.length < 4) {
              return await interaction.editReply({
                embeds: [
                  buildEmbed({
                    title: formatErrorTitle(COMMAND_KEYS.PICKUP),
                    description:
                      "Verification puzzle could not be loaded. Please try again later.",
                    error: true,
                  }),
                ],
              });
            }

            return await sendVerificationCaptchaPuzzle(
              interaction,
              client,
              userId,
              emojisList,
              {
                commandKey: COMMAND_KEYS.PICKUP,
                onCaptchaSuccess: async (i) => {
                  const captchaUserId = i.user.id;
                  await i.deferUpdate();
                  await verificationsApi.completeAfterCaptcha(captchaUserId);
                  const captchaRoles =
                    i.member?.roles?.cache?.map((r) => r.id) ?? null;
                  const joinResponse = await joinDrop(
                    dropMessageId,
                    captchaUserId,
                    captchaRoles,
                  );
                  if (
                    !(await checkStatuses(
                      i,
                      joinResponse,
                      STATUS_CODES.ACCEPTED,
                      COMMAND_KEYS.PICKUP,
                    ))
                  )
                    return;
                  await i.editReply({
                    embeds: [
                      buildEmbed({
                        color: COLORS.NANOBOT_BLUE,
                        title:
                          EMOJIS.JOIN_DROP +
                          " " +
                          COMMAND_DESCRIPTIONS.PICKUP,
                        description: `This drop will be evenly distributed to the winner(s) when the drop ends!`,
                      }),
                    ],
                    components: [],
                  });
                },
              },
            );
          }

          const response = await joinDrop(
            dropMessageId,
            interaction.user.id ?? null,
            roleIds,
          );

          if (
            !(await checkStatuses(
              interaction,
              response,
              STATUS_CODES.ACCEPTED,
              COMMAND_KEYS.PICKUP,
            ))
          )
            return;

          return await interaction.editReply({
            embeds: [
              buildEmbed({
                color: COLORS.NANOBOT_BLUE,
                title: EMOJIS.JOIN_DROP + " " + COMMAND_DESCRIPTIONS.PICKUP,
                description: `This drop will be evenly distributed to the winner(s) when the drop ends!`,
              }),
            ],
            components: [],
          });
        }
        return;
      }

      // Check for slash command interactions
      if (interaction.isCommand()) {
        const cooldownExpiry = client.cooldowns.get(userId);
        if (cooldownExpiry && Date.now() < cooldownExpiry) {
          return await interaction.reply({
            content: `<@${userId}>, please wait for your command cooldown to end.`,
            ephemeral: true,
          });
        }

        setCooldown(client.cooldowns, userId, slashCommandCooldown);

        await interaction.deferReply({ ephemeral: true });

        const command = client.commands.get(interaction.commandName);
        if (!command) {
          await interaction.editReply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
          return;
        }

        await command.execute(interaction, client);
      }
    } catch (error) {
      console.error("interactionCreate catch", error);
      await interaction.editReply({
        content:
          "There was an error while executing this command, please try again!",
        ephemeral: true,
      });
    }
  });

  console.log("Watching for new guild messages...");
  client.on("messageCreate", async (message) => {
    if (message.author.bot) {
      return;
    }
    if (
      message.author?.id &&
      message.channel?.id &&
      message.guild?.id
    ) {
      await setActivity(
        message.guild.id,
        message.channel.id,
        message.author.id,
      );
    }
  });

  console.log("Watching for new guilds...");
  client.on("guildCreate", async (guild) => {
    await guild.members.fetch();
  });

  console.log("Logging in...");
  client.login(process.env.BOT_USER_SECRET);
  console.log("Nanobot is ONLINE");
}

async function run() {
  await initialize();
}

run();
