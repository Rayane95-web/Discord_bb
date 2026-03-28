const { SlashCommandBuilder } = require('discord.js');
const { pauseGiveaway } = require('../managers/giveawayManager');
const { hasGiveawayPermission } = require('../utils/permissions');
const { getDb } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gpause')
    .setDescription('⏸️ Pause or resume a giveaway')
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
      return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
    }

    if (giveaway.ended) {
      return interaction.reply({ content: '❌ Cannot pause an ended giveaway.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const newPaused = await pauseGiveaway(client, messageId);

    await interaction.editReply({
      content: newPaused
        ? '⏸️ Giveaway has been **paused**. No new entries will be accepted.'
        : '▶️ Giveaway has been **resumed**!',
    });
  },
};
