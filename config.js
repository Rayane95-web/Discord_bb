require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: '1487546583821058268',

  giveaway: {
    emoji: '🎉',
    color: 0x7289da,
    embedColor: 0x2f3136,
    winnerColor: 0xffd700,
    endedColor: 0x99aab5,
    checkInterval: 5000,
  },

  managerRoles: [],
};
