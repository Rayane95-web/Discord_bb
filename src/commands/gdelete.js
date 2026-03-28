const { SlashCommandBuilder } = require('discord.js');
const { hasGiveawayPermission } = require('../utils/permissions');
const { getDb } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gdelete')
    .setDescription('🗑️ Delete a giveaway (removes the message and database entry)')
    .addStringOption((o) =>
      o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
    ),

  async execute(interaction, client) {
    if (!hasGiveawayPermission(interaction.member)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }

    const messageId = interaction.options.getString('message_id');
    const db = getDb();
    const g = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?')
      .get(messageId, interaction.guild.id);

    if (!g) {
      return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // Delete the message
    const channel = await interaction.guild.channels.fetch(g.channel_id).catch(() => null);
    if (channel) {
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (message) await message.delete().catch(() => {});
    }

    db.prepare('DELETE FROM giveaways WHERE message_id = ?').run(messageId);

    await interaction.editReply({ content: `🗑️ Giveaway for **${g.prize}** has been deleted.` });
  },
};
