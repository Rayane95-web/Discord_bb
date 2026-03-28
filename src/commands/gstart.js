const { SlashCommandBuilder } = require('discord.js');
const { createGiveaway, parseTime } = require('../managers/giveawayManager');
const { hasGiveawayPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gstart')
    .setDescription('🎉 Start a new giveaway')
    .addStringOption((o) =>
      o.setName('duration').setDescription('Duration (e.g. 1h, 30m, 2d)').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('prize').setDescription('What are you giving away?').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('winners').setDescription('Number of winners (default: 1)').setMinValue(1).setMaxValue(20)
    )
    .addChannelOption((o) =>
      o.setName('channel').setDescription('Channel to host the giveaway (default: current)')
    )
    .addRoleOption((o) =>
      o.setName('required_role').setDescription('Role required to enter')
    )
    .addIntegerOption((o) =>
      o.setName('min_account_age').setDescription('Minimum account age in days to enter').setMinValue(0)
    )
    .addStringOption((o) =>
      o.setName('description').setDescription('Optional description for the giveaway')
    ),

  async execute(interaction, client) {
    if (!hasGiveawayPermission(interaction.member)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission to start giveaways.', ephemeral: true });
    }

    const durationStr = interaction.options.getString('duration');
    const duration = parseTime(durationStr);

    if (!duration || duration < 5000) {
      return interaction.reply({ content: '❌ Invalid duration. Use formats like `1h`, `30m`, `2d 12h`.', ephemeral: true });
    }

    if (duration > 30 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ content: '❌ Duration cannot exceed **30 days**.', ephemeral: true });
    }

    const prize = interaction.options.getString('prize');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const requiredRole = interaction.options.getRole('required_role');
    const minAccountAge = interaction.options.getInteger('min_account_age') || 0;
    const description = interaction.options.getString('description');

    await interaction.deferReply({ ephemeral: true });

    try {
      const msg = await createGiveaway(client, {
        channel: targetChannel,
        prize,
        duration,
        winnerCount,
        hostId: interaction.user.id,
        requiredRole: requiredRole?.id || null,
        minAccountAge,
        description,
      });

      await interaction.editReply({
        content: `✅ Giveaway started in ${targetChannel}!\n[Jump to giveaway](${msg.url})`,
      });
    } catch (err) {
      console.error('[gstart]', err);
      await interaction.editReply({ content: '❌ Failed to create giveaway. Check my permissions.' });
    }
  },
};
