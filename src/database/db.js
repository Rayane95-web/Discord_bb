const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  db = new Database(path.join(__dirname, '../../giveaways.db'));

  db.exec(`
    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE NOT NULL,
      channel_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      host_id TEXT NOT NULL,
      prize TEXT NOT NULL,
      winner_count INTEGER NOT NULL DEFAULT 1,
      entries TEXT NOT NULL DEFAULT '[]',
      required_role TEXT,
      min_account_age INTEGER DEFAULT 0,
      bonus_entries TEXT NOT NULL DEFAULT '{}',
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      ended INTEGER NOT NULL DEFAULT 0,
      winners TEXT NOT NULL DEFAULT '[]',
      paused INTEGER NOT NULL DEFAULT 0,
      description TEXT
    )
  `);

  console.log('[DB] Database initialized.');
  return db;
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };
