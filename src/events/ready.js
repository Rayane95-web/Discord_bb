const { ActivityType } = require('discord.js');
const { startGiveawayTimer } = require('../managers/giveawayManager');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[BOT] Logged in as ${client.user.tag}`);
    console.log(`[BOT] Developed by 9attos.x2`);
    client.user.setActivity('🎉 Giveaways | by 9attos.x2', { type: ActivityType.Watching });
    startGiveawayTimer(client);
  },
};
