const { SlashCommandBuilder } = require('discord.js');
const { endGiveaway } = require('../managers/giveawayManager');
const { hasGiveawayPermission } = require('../utils/permissions');
const { getDb } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('⏹️ Force-end an active giveaway')
    .addStringOption((o) =>
      o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
    ),

  async execute(interaction, client) {
    if (!hasGiveawayPermission(interaction.member)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }

    const messageId = interaction.options.getString('message_id');
    const db = getDb();
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?')
      .get(messageId, interaction.guild.id);

    if (!giveaway) {
      return interaction.reply({ content: '❌ Giveaway not found in this server.', ephemeral: true });
    }

    if (giveaway.ended) {
      return interaction.reply({ content: '❌ This giveaway already ended.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const result = await endGiveaway(client, messageId, true);

    if (!result) {
      return interaction.editReply({ content: '❌ Failed to end the giveaway.' });
    }

    await interaction.editReply({ content: `✅ Giveaway for **${result.prize}** has been ended.` });
  },
};
