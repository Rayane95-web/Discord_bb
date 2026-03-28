const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initDatabase } = require('./database/db');
const config = require('../config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.giveaways = new Collection();

(async () => {
  await initDatabase();
  await loadCommands(client);
  await loadEvents(client);

  await client.login(config.token);
})();
