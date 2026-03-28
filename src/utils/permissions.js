const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

function hasGiveawayPermission(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;

  if (config.managerRoles.length > 0) {
    return config.managerRoles.some((roleId) => member.roles.cache.has(roleId));
  }

  return false;
}

module.exports = { hasGiveawayPermission };
