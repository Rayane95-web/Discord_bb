const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { msToTime } = require('../managers/giveawayManager');
const { getDb } = require('../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ginfo')
    .setDescription('🔍 View detailed info about a giveaway')
    .addStringOption((o) =>
      o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
    ),

  async execute(interaction, client) {
    const messageId = interaction.options.getString('message_id');
    const db = getDb();
    const g = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?')
      .get(messageId, interaction.guild.id);

    if (!g) {
      return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
    }

    const entries = JSON.parse(g.entries);
    const uniqueEntries = [...new Set(entries)].length;
    const winners = JSON.parse(g.winners);
    const bonusEntries = JSON.parse(g.bonus_entries);
    const timeLeft = g.end_time - Date.now();

    const embed = new EmbedBuilder()
      .setTitle(`${config.giveaway.emoji} ${g.prize}`)
      .setColor(g.ended ? config.giveaway.endedColor : config.giveaway.color)
      .setTimestamp(g.end_time);

    embed.addFields(
      { name: '📌 Message ID', value: `\`${g.message_id}\``, inline: true },
      { name: '📢 Channel', value: `<#${g.channel_id}>`, inline: true },
      { name: '🎟️ Host', value: `<@${g.host_id}>`, inline: true },
      { name: '🏆 Winners', value: `${g.winner_count}`, inline: true },
      { name: '👥 Unique Entries', value: `${uniqueEntries}`, inline: true },
      { name: '📊 Total Weighted Entries', value: `${entries.length}`, inline: true },
      { name: '🔒 Required Role', value: g.required_role ? `<@&${g.required_role}>` : 'None', inline: true },
      { name: '📅 Min Account Age', value: g.min_account_age > 0 ? `${g.min_account_age} days` : 'None', inline: true },
      { name: '⏸️ Paused', value: g.paused ? 'Yes' : 'No', inline: true }
    );

    if (Object.keys(bonusEntries).length > 0) {
      embed.addFields({
        name: '⭐ Bonus Entries',
        value: Object.entries(bonusEntries).map(([r, c]) => `<@&${r}>: +${c}`).join('\n'),
        inline: false,
      });
    }

    if (g.ended) {
      embed.addFields({
        name: '🎊 Winners',
        value: winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : 'No winners',
        inline: false,
      });
      embed.setFooter({ text: 'Giveaway ended' });
    } else {
      embed.addFields({
        name: '⏳ Time Left',
        value: timeLeft > 0 ? msToTime(timeLeft) : 'Ending very soon...',
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
