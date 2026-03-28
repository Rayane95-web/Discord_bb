const { SlashCommandBuilder } = require('discord.js');
const { hasGiveawayPermission } = require('../utils/permissions');
const { getDb } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gbonus')
    .setDescription('⭐ Add or remove bonus entries for a role on a giveaway')
    .addStringOption((o) =>
      o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
    )
    .addRoleOption((o) =>
      o.setName('role').setDescription('The role to give bonus entries').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('entries').setDescription('Number of bonus entries (0 to remove)').setMinValue(0).setMaxValue(100).setRequired(true)
    ),

  async execute(interaction, client) {
    if (!hasGiveawayPermission(interaction.member)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }

    const messageId = interaction.options.getString('message_id');
    const role = interaction.options.getRole('role');
    const extraEntries = interaction.options.getInteger('entries');
    const db = getDb();

    const g = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ? AND ended = 0')
      .get(messageId, interaction.guild.id);

    if (!g) {
      return interaction.reply({ content: '❌ Active giveaway not found.', ephemeral: true });
    }

    const bonus = JSON.parse(g.bonus_entries);

    if (extraEntries === 0) {
      delete bonus[role.id];
    } else {
      bonus[role.id] = extraEntries;
    }

    db.prepare('UPDATE giveaways SET bonus_entries = ? WHERE message_id = ?').run(
      JSON.stringify(bonus),
      messageId
    );

    const msg =
      extraEntries === 0
        ? `✅ Removed bonus entries for **${role.name}** from the giveaway.`
        : `✅ Members with **${role.name}** will now get **+${extraEntries}** extra entries!`;

    await interaction.reply({ content: msg, ephemeral: true });
  },
};
