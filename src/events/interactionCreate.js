const { handleEntry } = require('../managers/giveawayManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[CMD ERROR] /${interaction.commandName}:`, err);
        const msg = { content: '❌ An error occurred running this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
    }

    // ── Button: Enter Giveaway
    if (interaction.isButton() && interaction.customId === 'giveaway_enter') {
      await handleEntry(client, interaction);
    }
  },
};
