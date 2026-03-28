const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDb } = require('../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ghistory')
    .setDescription('📜 View ended giveaway history for this server')
    .addIntegerOption((o) =>
      o.setName('page').setDescription('Page number').setMinValue(1)
    ),

  async execute(interaction, client) {
    const page = interaction.options.getInteger('page') || 1;
    const pageSize = 5;
    const offset = (page - 1) * pageSize;
    const db = getDb();

    const total = db.prepare('SELECT COUNT(*) as count FROM giveaways WHERE guild_id = ? AND ended = 1').get(interaction.guild.id).count;
    const giveaways = db.prepare(
      'SELECT * FROM giveaways WHERE guild_id = ? AND ended = 1 ORDER BY end_time DESC LIMIT ? OFFSET ?'
    ).all(interaction.guild.id, pageSize, offset);

    if (!giveaways.length) {
      return interaction.reply({ content: '📭 No ended giveaways found.', ephemeral: true });
    }

    const totalPages = Math.ceil(total / pageSize);
    const embed = new EmbedBuilder()
      .setTitle('📜 Giveaway History')
      .setColor(config.giveaway.endedColor)
      .setFooter({ text: `Page ${page}/${totalPages} • ${total} total giveaways` })
      .setTimestamp();

    for (const g of giveaways) {
      const winners = JSON.parse(g.winners);
      const entries = JSON.parse(g.entries);
      const endDate = new Date(g.end_time).toLocaleDateString();

      embed.addFields({
        name: `${config.giveaway.emoji} ${g.prize}`,
        value: [
          `**ID:** \`${g.message_id}\``,
          `**Ended:** ${endDate}`,
          `**Entries:** ${[...new Set(entries)].length} | **Winners:** ${winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : 'None'}`,
        ].join('\n'),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
