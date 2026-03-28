require('dotenv').config();

module.exports = {
  // ─── Bot Credentials (from .env) ──────────────────────────────────────────
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,

  // ─── Giveaway Defaults ─────────────────────────────────────────────────────
  giveaway: {
    emoji: '🎉',
    color: 0x7289da,
    embedColor: 0x2f3136,
    winnerColor: 0xffd700,
    endedColor: 0x99aab5,
    checkInterval: 5000, // ms — how often to check for ended giveaways
  },

  // ─── Permissions ───────────────────────────────────────────────────────────
  managerRoles: [], // Role IDs that can manage giveaways (leave empty = admins only)
};
