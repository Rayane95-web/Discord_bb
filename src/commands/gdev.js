const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gdev')
    .setDescription('👨‍💻 About this bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Discord Giveaway Bot')
      .setColor(config.giveaway.color)
      .setDescription('A full-featured giveaway bot for Discord.')
      .addFields(
        { name: '👨‍💻 Developer', value: '**9attos.x2**', inline: true },
        { name: '📦 Version', value: '**1.0.0**', inline: true },
        { name: '🔧 Built With', value: 'discord.js v14', inline: true },
        {
          name: '📖 Commands',
          value: '`/gstart` `/gend` `/greroll` `/gpause` `/gdelete` `/gbonus` `/glist` `/ginfo` `/ghistory`',
          inline: false,
        }
      )
      .setFooter({ text: 'Made by 9attos.x2' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
