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
const { execute: getCreatures } = require("./jobs/getCreatures.js");
const { execute: getCurrencies } = require("./jobs/getCurrencies.js");
const { execute: setActivity } = require("./jobs/setActivity.js");
const { execute: setCommands } = require("./jobs/setCommands.js");
const { execute: joinDrop } = require("./requests/pickup.js");
const triviasApi = require("./requests/trivias.js");
const verificationsApi = require("./requests/verifications.js");
const { checkStatuses } = require("./utils/statusUtil.js");
const { safeDeferUpdate } = require("./utils/interactionUtil.js");
const { parseTriviaCustomId } = require("./utils/triviaUtil.js");

// Backstop. Any unhandled rejection terminates Node, which takes the bot
// offline for every guild until the container restarts. A single expired
// interaction token is not worth an outage, so log and keep running.
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION (kept alive):", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION (kept alive):", err);
});

/**
 * Live data some commands need to build their options. Discord fixes a
 * command's choices at deploy time, so this is read once per boot. A command
 * that cannot get its data simply deploys without the dependent option.
 */
async function loadCommandContext() {
  const [currenciesResponse, creaturesResponse, triviaCategoriesResponse] =
    await Promise.all([getCurrencies(), getCreatures(), triviasApi.getCategories()]);

  const currencies = currenciesResponse?.data ?? null;
  const creatures = creaturesResponse?.data ?? null;
  // Served to /triviadrop's category autocomplete. An empty list only costs
  // the suggestions; the API still validates whatever is typed.
  const triviaCategories = Array.isArray(triviaCategoriesResponse?.data)
    ? triviaCategoriesResponse.data
    : [];

  if (!currencies?.length || !creatures?.length) {
    console.warn(
      "Could not load currencies and creatures; deploying commands without currency choices.",
    );
  }
  if (!triviaCategories.length) {
    console.warn(
      "Could not load trivia categories; /triviadrop will offer no category suggestions.",
    );
  }

  return { currencies, creatures, triviaCategories };
}

async function toCommandJson(command, context) {
  const data = command.buildData
    ? await command.buildData(context)
    : command.data;
  return data.toJSON();
}

async function deployCommands(commandContext) {
  const rest = new REST({ version: "9" }).setToken(process.env.BOT_USER_SECRET);

  const serverCommands = [];
  const serverCommandFiles = fs
    .readdirSync("./commands/Server")
    .filter((file) => file.endsWith(".js"));

  for (const file of serverCommandFiles) {
    const command = require("./commands/Server/" + file);
    serverCommands.push(await toCommandJson(command, commandContext));
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
      globalCommands.push(await toCommandJson(command, commandContext));
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

/**
 * Shared path for every button that enters a drop: the plain "Join Drop"
 * button and each trivia answer button. Applies the button cooldown, sends
 * unverified users through the captcha first, then records the pickup (with
 * the pressed answer's index on a trivia drop) and shows the given reply.
 *
 * @param {object} options
 * @param {number|null} options.answerIndex 0-based answer on a trivia drop, else null
 * @param {string} options.commandKey command key used in error titles
 * @param {string} options.successTitle title of the ephemeral confirmation
 * @param {string} options.successDescription body of the ephemeral confirmation
 */
async function handlePickupButton(interaction, client, options) {
  const { answerIndex, commandKey, successTitle, successDescription } =
    options;
  const userId = interaction.user.id;

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
  const roleIds = interaction.member.roles.cache.map((r) => r.id) ?? null;

  const successEmbed = buildEmbed({
    color: COLORS.NANOBOT_BLUE,
    title: successTitle,
    description: successDescription,
  });

  const checkResponse = await verificationsApi.check(userId);

  if (checkResponse?.status !== 200) {
    const emojisList = Array.isArray(checkResponse?.data)
      ? checkResponse.data
      : null;

    if (!emojisList || emojisList.length < 4) {
      return await interaction.editReply({
        embeds: [
          buildEmbed({
            title: formatErrorTitle(commandKey),
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
        commandKey,
        onCaptchaSuccess: async (i) => {
          const captchaUserId = i.user.id;
          // A captcha can sit unanswered long enough for the token to
          // expire. Throwing here used to terminate the process.
          if (!(await safeDeferUpdate(i))) return;
          await verificationsApi.completeAfterCaptcha(captchaUserId);
          const captchaRoles =
            i.member?.roles?.cache?.map((r) => r.id) ?? null;
          const joinResponse = await joinDrop(
            dropMessageId,
            captchaUserId,
            captchaRoles,
            answerIndex,
          );
          if (
            !(await checkStatuses(
              i,
              joinResponse,
              STATUS_CODES.ACCEPTED,
              commandKey,
            ))
          )
            return;
          await i.editReply({
            embeds: [successEmbed],
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
    answerIndex,
  );

  if (
    !(await checkStatuses(
      interaction,
      response,
      STATUS_CODES.ACCEPTED,
      commandKey,
    ))
  )
    return;

  return await interaction.editReply({
    embeds: [successEmbed],
    components: [],
  });
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

  // Autocomplete has three seconds to answer, so the same startup data that
  // builds the command options is kept for handlers to read from.
  client.commandContext = await loadCommandContext();

  console.log("Telling Discord about the commands...");
  await deployCommands(client.commandContext);

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

      // Suggestions must be answered directly and must not be deferred, so this
      // runs ahead of the member fetch and every other branch.
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
          try {
            await command.autocomplete(interaction, client);
          } catch (error) {
            console.error("autocomplete", interaction.commandName, error);
          }
        }
        return;
      }

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
          return await handlePickupButton(interaction, client, {
            answerIndex: null,
            commandKey: COMMAND_KEYS.PICKUP,
            successTitle: EMOJIS.JOIN_DROP + " " + COMMAND_DESCRIPTIONS.PICKUP,
            successDescription:
              "This drop will be evenly distributed to the winner(s) when the drop ends!",
          });
        }
        // A trivia answer is a pickup that also says which button was pressed.
        // The reply confirms the answer was recorded and nothing more: whether
        // it was right is revealed to everyone when the drop ends.
        const answerIndex = parseTriviaCustomId(interaction.customId);
        if (answerIndex !== null) {
          return await handlePickupButton(interaction, client, {
            answerIndex,
            commandKey: COMMAND_KEYS.TRIVIA_ANSWER,
            successTitle:
              EMOJIS.TRIVIA_BRAIN + " " + COMMAND_DESCRIPTIONS.TRIVIA_ANSWER,
            successDescription:
              "Your answer has been recorded and cannot be changed. The correct answer and the winners are revealed when the trivia drop ends!",
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
