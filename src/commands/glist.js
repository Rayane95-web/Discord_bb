const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasGiveawayPermission } = require('../utils/permissions');
const { msToTime } = require('../managers/giveawayManager');
const { getDb } = require('../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('glist')
    .setDescription('📋 List all active giveaways in this server'),

  async execute(interaction, client) {
    if (!hasGiveawayPermission(interaction.member)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }

    const db = getDb();
    const giveaways = db
      .prepare('SELECT * FROM giveaways WHERE guild_id = ? AND ended = 0 ORDER BY end_time ASC')
      .all(interaction.guild.id);

    if (!giveaways.length) {
      return interaction.reply({ content: '📭 No active giveaways in this server.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Active Giveaways')
      .setColor(config.giveaway.color)
      .setDescription(`**${giveaways.length}** active giveaway(s)`)
      .setTimestamp();

    for (const g of giveaways.slice(0, 10)) {
      const timeLeft = g.end_time - Date.now();
      const entries = JSON.parse(g.entries);
      const uniqueEntries = [...new Set(entries)].length;
      const status = g.paused ? '⏸ Paused' : timeLeft > 0 ? `⏳ ${msToTime(timeLeft)}` : 'Ending soon';

      embed.addFields({
        name: `${config.giveaway.emoji} ${g.prize}`,
        value: [
          `**ID:** \`${g.message_id}\``,
          `**Channel:** <#${g.channel_id}>`,
          `**Winners:** ${g.winner_count} | **Entries:** ${uniqueEntries}`,
          `**Status:** ${status}`,
        ].join('\n'),
        inline: false,
      });
    }

    if (giveaways.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${giveaways.length} giveaways` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
