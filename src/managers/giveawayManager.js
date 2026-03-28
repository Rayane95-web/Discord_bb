const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDb } = require('../database/db');
const config = require('../../config');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msToTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function parseTime(str) {
  const regex = /(\d+)\s*(d|h|m|s)/gi;
  let total = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'd') total += val * 86400000;
    else if (unit === 'h') total += val * 3600000;
    else if (unit === 'm') total += val * 60000;
    else if (unit === 's') total += val * 1000;
  }
  return total;
}

function buildGiveawayEmbed(giveaway, timeLeft) {
  const ended = giveaway.ended === 1;
  const paused = giveaway.paused === 1;
  const entries = JSON.parse(giveaway.entries);
  const winners = JSON.parse(giveaway.winners);

  const color = ended
    ? config.giveaway.endedColor
    : winners.length
    ? config.giveaway.winnerColor
    : config.giveaway.color;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${config.giveaway.emoji} ${giveaway.prize}`)
    .setTimestamp(giveaway.end_time);

  const fields = [];

  if (giveaway.description) {
    embed.setDescription(giveaway.description);
  }

  fields.push({
    name: '🏆 Winners',
    value: `**${giveaway.winner_count}**`,
    inline: true,
  });

  fields.push({
    name: '👥 Entries',
    value: `**${entries.length}**`,
    inline: true,
  });

  fields.push({
    name: '🎟️ Host',
    value: `<@${giveaway.host_id}>`,
    inline: true,
  });

  if (giveaway.required_role) {
    fields.push({
      name: '🔒 Required Role',
      value: `<@&${giveaway.required_role}>`,
      inline: true,
    });
  }

  if (giveaway.min_account_age > 0) {
    fields.push({
      name: '📅 Min Account Age',
      value: `${giveaway.min_account_age} days`,
      inline: true,
    });
  }

  const bonusEntries = JSON.parse(giveaway.bonus_entries);
  if (Object.keys(bonusEntries).length > 0) {
    const bonusList = Object.entries(bonusEntries)
      .map(([roleId, count]) => `<@&${roleId}>: **+${count}**`)
      .join('\n');
    fields.push({ name: '⭐ Bonus Entries', value: bonusList, inline: false });
  }

  if (ended) {
    if (winners.length > 0) {
      fields.push({
        name: '🎊 Winners',
        value: winners.map((id) => `<@${id}>`).join(', '),
        inline: false,
      });
    } else {
      fields.push({ name: '❌ No Winners', value: 'Not enough entries.', inline: false });
    }
    embed.setFooter({ text: `Ended` });
  } else if (paused) {
    fields.push({ name: '⏸️ Status', value: 'Giveaway is **paused**', inline: false });
    embed.setFooter({ text: `Paused • Ends` });
  } else {
    embed.setFooter({ text: `${giveaway.winner_count} winner(s) • Ends` });
    if (timeLeft !== undefined) {
      fields.push({
        name: '⏳ Time Remaining',
        value: `**${msToTime(timeLeft)}**`,
        inline: true,
      });
    }
  }

  embed.addFields(fields);
  return embed;
}

function buildGiveawayButton(ended = false, paused = false, entryCount = 0) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel(ended ? 'Ended' : paused ? '⏸ Paused' : `${config.giveaway.emoji} Enter (${entryCount})`)
      .setStyle(ended || paused ? ButtonStyle.Secondary : ButtonStyle.Primary)
      .setDisabled(ended || paused)
  );
}

// ─── Core Functions ────────────────────────────────────────────────────────────

async function createGiveaway(client, options) {
  const {
    channel,
    prize,
    duration,
    winnerCount = 1,
    hostId,
    requiredRole = null,
    minAccountAge = 0,
    bonusEntries = {},
    description = null,
  } = options;

  const now = Date.now();
  const endTime = now + duration;

  const embed = buildGiveawayEmbed(
    {
      prize,
      winner_count: winnerCount,
      host_id: hostId,
      required_role: requiredRole,
      min_account_age: minAccountAge,
      bonus_entries: JSON.stringify(bonusEntries),
      entries: '[]',
      winners: '[]',
      ended: 0,
      paused: 0,
      end_time: endTime,
      description,
    },
    duration
  );

  const row = buildGiveawayButton(false, false, 0);
  const msg = await channel.send({ embeds: [embed], components: [row] });

  const db = getDb();
  db.prepare(`
    INSERT INTO giveaways
      (message_id, channel_id, guild_id, host_id, prize, winner_count, required_role,
       min_account_age, bonus_entries, start_time, end_time, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    msg.id,
    channel.id,
    channel.guild.id,
    hostId,
    prize,
    winnerCount,
    requiredRole,
    minAccountAge,
    JSON.stringify(bonusEntries),
    now,
    endTime,
    description
  );

  return msg;
}

async function endGiveaway(client, messageId, force = false) {
  const db = getDb();
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
  if (!giveaway) return null;
  if (giveaway.ended && !force) return giveaway;

  const guild = await client.guilds.fetch(giveaway.guild_id).catch(() => null);
  if (!guild) return null;

  const channel = await guild.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return null;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return null;

  const entries = JSON.parse(giveaway.entries);
  const winners = pickWinners(entries, giveaway.winner_count, guild, giveaway);

  db.prepare('UPDATE giveaways SET ended = 1, winners = ? WHERE message_id = ?').run(
    JSON.stringify(winners),
    messageId
  );

  const updatedGiveaway = { ...giveaway, ended: 1, winners: JSON.stringify(winners) };
  const embed = buildGiveawayEmbed(updatedGiveaway);
  const row = buildGiveawayButton(true);

  await message.edit({ embeds: [embed], components: [row] });

  if (winners.length > 0) {
    await channel.send({
      content: `🎉 Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!\n> Hosted by <@${giveaway.host_id}>`,
    });
  } else {
    await channel.send({ content: `😔 No valid entries for **${giveaway.prize}**. No winners selected.` });
  }

  return { ...updatedGiveaway, winnerList: winners };
}

function pickWinners(entries, count, guild, giveaway) {
  // Weighted entries based on bonus roles
  const bonusEntries = JSON.parse(giveaway.bonus_entries || '{}');
  const weighted = [];

  for (const userId of [...new Set(entries)]) {
    // Count base entry = 1
    let weight = 1;

    // Add bonus weight if applicable (approximate — we don't have member cache here)
    // Real bonus role check happens at entry time
    weighted.push(...Array(weight).fill(userId));
  }

  const shuffled = weighted.sort(() => Math.random() - 0.5);
  const picked = [];

  for (const userId of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(userId)) picked.push(userId);
  }

  return picked;
}

async function rerollGiveaway(client, messageId, winnerCount) {
  const db = getDb();
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
  if (!giveaway || !giveaway.ended) return null;

  const guild = await client.guilds.fetch(giveaway.guild_id).catch(() => null);
  if (!guild) return null;

  const channel = await guild.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return null;

  const entries = JSON.parse(giveaway.entries);
  const count = winnerCount || giveaway.winner_count;
  const newWinners = pickWinners(entries, count, guild, giveaway);

  db.prepare('UPDATE giveaways SET winners = ? WHERE message_id = ?').run(
    JSON.stringify(newWinners),
    messageId
  );

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (message) {
    const updatedGiveaway = { ...giveaway, winners: JSON.stringify(newWinners) };
    const embed = buildGiveawayEmbed(updatedGiveaway);
    await message.edit({ embeds: [embed] });
  }

  if (newWinners.length > 0) {
    await channel.send({
      content: `🔁 Reroll! New winner(s): ${newWinners.map((id) => `<@${id}>`).join(', ')}! Congratulations for winning **${giveaway.prize}**!`,
    });
  } else {
    await channel.send({ content: `😔 Still no valid entries for the reroll.` });
  }

  return newWinners;
}

async function pauseGiveaway(client, messageId) {
  const db = getDb();
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
  if (!giveaway || giveaway.ended) return null;

  const newPaused = giveaway.paused ? 0 : 1;
  db.prepare('UPDATE giveaways SET paused = ? WHERE message_id = ?').run(newPaused, messageId);

  const guild = await client.guilds.fetch(giveaway.guild_id).catch(() => null);
  const channel = await guild?.channels.fetch(giveaway.channel_id).catch(() => null);
  const message = await channel?.messages.fetch(messageId).catch(() => null);

  if (message) {
    const updated = { ...giveaway, paused: newPaused };
    const timeLeft = giveaway.end_time - Date.now();
    const embed = buildGiveawayEmbed(updated, timeLeft > 0 ? timeLeft : 0);
    const entries = JSON.parse(giveaway.entries);
    const row = buildGiveawayButton(false, !!newPaused, entries.length);
    await message.edit({ embeds: [embed], components: [row] });
  }

  return newPaused;
}

async function handleEntry(client, interaction) {
  const db = getDb();
  const giveaway = db
    .prepare('SELECT * FROM giveaways WHERE message_id = ? AND ended = 0 AND paused = 0')
    .get(interaction.message.id);

  if (!giveaway) {
    return interaction.reply({ content: '❌ This giveaway is no longer active.', ephemeral: true });
  }

  const userId = interaction.user.id;
  const entries = JSON.parse(giveaway.entries);
  const alreadyEntered = entries.includes(userId);

  // ── Required role check
  if (giveaway.required_role) {
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member || !member.roles.cache.has(giveaway.required_role)) {
      return interaction.reply({
        content: `❌ You need the <@&${giveaway.required_role}> role to enter this giveaway.`,
        ephemeral: true,
      });
    }
  }

  // ── Min account age check
  if (giveaway.min_account_age > 0) {
    const accountAge = (Date.now() - interaction.user.createdTimestamp) / 86400000;
    if (accountAge < giveaway.min_account_age) {
      return interaction.reply({
        content: `❌ Your account must be at least **${giveaway.min_account_age} days** old to enter.`,
        ephemeral: true,
      });
    }
  }

  if (alreadyEntered) {
    // Remove entry (toggle)
    const newEntries = entries.filter((id) => id !== userId);
    db.prepare('UPDATE giveaways SET entries = ? WHERE message_id = ?').run(
      JSON.stringify(newEntries),
      giveaway.message_id
    );

    const updated = { ...giveaway, entries: JSON.stringify(newEntries) };
    const timeLeft = giveaway.end_time - Date.now();
    const embed = buildGiveawayEmbed(updated, timeLeft > 0 ? timeLeft : 0);
    const row = buildGiveawayButton(false, false, newEntries.length);
    await interaction.message.edit({ embeds: [embed], components: [row] });

    return interaction.reply({ content: '✅ You have left the giveaway.', ephemeral: true });
  }

  // ── Add entry (with possible bonus entries)
  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  const bonusEntries = JSON.parse(giveaway.bonus_entries);
  let extraEntries = 0;

  if (member) {
    for (const [roleId, count] of Object.entries(bonusEntries)) {
      if (member.roles.cache.has(roleId)) {
        extraEntries += count;
      }
    }
  }

  const newEntries = [...entries, userId, ...Array(extraEntries).fill(userId)];
  db.prepare('UPDATE giveaways SET entries = ? WHERE message_id = ?').run(
    JSON.stringify(newEntries),
    giveaway.message_id
  );

  const updated = { ...giveaway, entries: JSON.stringify(newEntries) };
  const timeLeft = giveaway.end_time - Date.now();
  const embed = buildGiveawayEmbed(updated, timeLeft > 0 ? timeLeft : 0);
  const uniqueEntries = [...new Set(newEntries)].length;
  const row = buildGiveawayButton(false, false, uniqueEntries);
  await interaction.message.edit({ embeds: [embed], components: [row] });

  const msg =
    extraEntries > 0
      ? `🎉 You entered the giveaway with **${1 + extraEntries} entries** (bonus from roles)!`
      : `🎉 You entered the giveaway! Good luck!`;

  return interaction.reply({ content: msg, ephemeral: true });
}

// ─── Timer Loop ────────────────────────────────────────────────────────────────

async function startGiveawayTimer(client) {
  setInterval(async () => {
    const db = getDb();
    const now = Date.now();

    // Update embed countdowns for active giveaways
    const active = db
      .prepare('SELECT * FROM giveaways WHERE ended = 0 AND paused = 0')
      .all();

    for (const giveaway of active) {
      const timeLeft = giveaway.end_time - now;

      if (timeLeft <= 0) {
        await endGiveaway(client, giveaway.message_id);
        continue;
      }

      // Update embed every ~30s to show countdown
      if (timeLeft % 30000 < config.giveaway.checkInterval) {
        const guild = await client.guilds.fetch(giveaway.guild_id).catch(() => null);
        const channel = await guild?.channels.fetch(giveaway.channel_id).catch(() => null);
        const message = await channel?.messages.fetch(giveaway.message_id).catch(() => null);

        if (message) {
          const entries = JSON.parse(giveaway.entries);
          const embed = buildGiveawayEmbed(giveaway, timeLeft);
          const row = buildGiveawayButton(false, false, [...new Set(entries)].length);
          await message.edit({ embeds: [embed], components: [row] }).catch(() => {});
        }
      }
    }
  }, config.giveaway.checkInterval);
}

module.exports = {
  createGiveaway,
  endGiveaway,
  rerollGiveaway,
  pauseGiveaway,
  handleEntry,
  startGiveawayTimer,
  buildGiveawayEmbed,
  parseTime,
  msToTime,
};
