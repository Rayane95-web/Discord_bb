const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
  const commandData = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      commandData.push(command.data.toJSON());
      console.log(`[CMD] Loaded: /${command.data.name}`);
    }
  }

  const rest = new REST().setToken(config.token);
  try {
    await rest.put(Routes.applicationCommands(config.clientId), { body: commandData });
    console.log(`[CMD] Registered ${commandData.length} slash commands globally.`);
  } catch (err) {
    console.error('[CMD] Failed to register slash commands:', err);
  }
}

module.exports = { loadCommands };
