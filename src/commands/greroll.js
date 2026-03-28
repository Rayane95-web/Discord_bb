const { SlashCommandBuilder } = require('discord.js');
const { rerollGiveaway } = require('../managers/giveawayManager');
const { hasGiveawayPermission } = require('../utils/permissions');
const { getDb } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('🔁 Reroll a ended giveaway')
    .addStringOption((o) =>
      o.setName('message_id').setDescription('Message ID of the ended giveaway').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('winners').setDescription('Number of new winners to pick').setMinValue(1).setMaxValue(20)
    ),

  async execute(interaction, client) {
    if (!hasGiveawayPermission(interaction.member)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }

    const messageId = interaction.options.getString('message_id');
    const winnerCount = interaction.options.getInteger('winners');
    const db = getDb();
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?')
      .get(messageId, interaction.guild.id);

    if (!giveaway) {
      return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
    }

    if (!giveaway.ended) {
      return interaction.reply({ content: '❌ This giveaway has not ended yet. Use `/gend` first.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const newWinners = await rerollGiveaway(client, messageId, winnerCount);

    if (!newWinners) {
      return interaction.editReply({ content: '❌ Reroll failed.' });
    }

    if (newWinners.length === 0) {
      return interaction.editReply({ content: '😔 No valid entries to reroll from.' });
    }

    await interaction.editReply({
      content: `✅ Rerolled! New winners: ${newWinners.map((id) => `<@${id}>`).join(', ')}`,
    });
  },
};
