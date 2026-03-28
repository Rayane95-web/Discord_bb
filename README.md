# 🎉 Discord Giveaway Bot

A full-featured, production-ready Discord giveaway bot built with **discord.js v14** and **SQLite**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎉 **Create Giveaways** | Set prize, duration, winners, channel |
| ⏹️ **Force End** | End any giveaway early |
| 🔁 **Reroll** | Pick new winners from existing entries |
| ⏸️ **Pause / Resume** | Temporarily stop entries |
| 🗑️ **Delete** | Remove a giveaway entirely |
| 📋 **List** | View all active giveaways |
| 🔍 **Info** | Detailed stats on any giveaway |
| 📜 **History** | Browse past giveaways |
| ⭐ **Bonus Entries** | Give extra entries per role |
| 🔒 **Required Roles** | Restrict who can enter |
| 📅 **Account Age Gate** | Minimum account age to enter |
| 🔘 **Button Entry** | Users click a button to enter/leave |
| ⏳ **Live Countdown** | Embed updates with time remaining |
| 💾 **Persistent Storage** | SQLite — survives restarts |

---

## 🚀 Setup

### 1. Prerequisites
- **Node.js v18+** — [Download](https://nodejs.org)
- A Discord bot token — [Create one here](https://discord.com/developers/applications)

### 2. Clone & Install

```bash
git clone <your-repo>
cd discord-giveaway-bot
npm install
```

### 3. Configure Environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
```

**Where to find these:**
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Select your app → **General Information** → copy **Application ID** (= `CLIENT_ID`)
- Go to **Bot** tab → **Reset Token** → copy it (= `DISCORD_TOKEN`)

### 4. Bot Permissions

When inviting the bot to your server, it needs these permissions:
- `Send Messages`
- `Embed Links`
- `Read Message History`
- `Add Reactions`
- `Use Application Commands` (slash commands)
- `Manage Messages` (optional, for cleanup)

Use this invite URL template (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878024704&scope=bot%20applications.commands
```

### 5. Start the Bot

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

On first start, slash commands register globally (takes up to 1 hour to propagate to all servers). For instant registration during testing, see [Guild Commands](#guild-commands-for-testing).

---

## 📖 Commands

All commands require **Manage Server** permission (or a role listed in `config.js → managerRoles`).

### `/gstart` — Start a Giveaway

| Option | Required | Description |
|---|---|---|
| `duration` | ✅ | Duration: `10m`, `2h`, `1d`, `2d 12h` |
| `prize` | ✅ | What you're giving away |
| `winners` | ➖ | Number of winners (default: 1) |
| `channel` | ➖ | Target channel (default: current) |
| `required_role` | ➖ | Role members must have to enter |
| `min_account_age` | ➖ | Minimum account age in days |
| `description` | ➖ | Extra description shown in embed |

**Example:**
```
/gstart duration:2h prize:Nitro Classic winners:3 required_role:@Members
```

---

### `/gend` — Force End a Giveaway
```
/gend message_id:1234567890123456789
```
Ends the giveaway immediately and picks winners.

---

### `/greroll` — Reroll Winners
```
/greroll message_id:1234567890123456789
/greroll message_id:1234567890123456789 winners:2
```
Picks new random winners from all entries.

---

### `/gpause` — Pause / Resume
```
/gpause message_id:1234567890123456789
```
Toggles pause state. Paused giveaways don't accept new entries.

---

### `/gdelete` — Delete a Giveaway
```
/gdelete message_id:1234567890123456789
```
Deletes the message and removes from database.

---

### `/gbonus` — Bonus Entries per Role
```
/gbonus message_id:1234567890123456789 role:@Booster entries:3
/gbonus message_id:1234567890123456789 role:@VIP entries:5
/gbonus message_id:1234567890123456789 role:@Booster entries:0   ← removes bonus
```

---

### `/glist` — List Active Giveaways
Shows all running giveaways in the server with IDs, time left, and entry counts.

---

### `/ginfo` — Giveaway Details
```
/ginfo message_id:1234567890123456789
```
Full stats: entries, winners, bonus roles, requirements, time left.

---

### `/ghistory` — Ended Giveaways
```
/ghistory
/ghistory page:2
```

---

## ⚙️ Configuration (`config.js`)

```js
managerRoles: ['ROLE_ID_1', 'ROLE_ID_2'],  // Extra roles that can run commands
giveaway: {
  emoji: '🎉',          // Emoji shown on entry button
  color: 0x7289da,      // Active embed color (hex)
  endedColor: 0x99aab5, // Ended embed color
  checkInterval: 5000,  // How often (ms) to check for ended giveaways
}
```

---

## 🧪 Guild Commands (for Testing)

To register commands instantly to a single server during development, add this to `commandHandler.js`:

```js
// Replace this line:
await rest.put(Routes.applicationCommands(config.clientId), { body: commandData });

// With this (replace GUILD_ID):
await rest.put(Routes.applicationGuildCommands(config.clientId, 'YOUR_GUILD_ID'), { body: commandData });
```

---

## 📁 Project Structure

```
discord-giveaway-bot/
├── src/
│   ├── index.js                  # Entry point
│   ├── commands/
│   │   ├── gstart.js             # Start a giveaway
│   │   ├── gend.js               # Force-end a giveaway
│   │   ├── greroll.js            # Reroll winners
│   │   ├── gpause.js             # Pause / resume
│   │   ├── gdelete.js            # Delete a giveaway
│   │   ├── glist.js              # List active giveaways
│   │   ├── ginfo.js              # Giveaway details
│   │   ├── gbonus.js             # Bonus entries per role
│   │   └── ghistory.js           # Ended giveaway history
│   ├── events/
│   │   ├── ready.js              # Bot ready + timer start
│   │   └── interactionCreate.js  # Commands + button handler
│   ├── handlers/
│   │   ├── commandHandler.js     # Load & register slash commands
│   │   └── eventHandler.js       # Load event files
│   ├── managers/
│   │   └── giveawayManager.js    # Core giveaway logic
│   ├── database/
│   │   └── db.js                 # SQLite setup
│   └── utils/
│       └── permissions.js        # Permission checks
├── config.js                     # Bot configuration
├── .env                          # Your secrets (never commit!)
├── .env.example                  # Template
├── .gitignore
├── package.json
└── README.md
```

---

## 🛡️ Security Notes

- **Never commit `.env`** — it contains your bot token
- The bot token gives full control of your bot — treat it like a password
- If your token leaks, immediately **Reset Token** in the Developer Portal

---

## 👨‍💻 Developer

Built by **9attos.x2**

## 📝 License

MIT — free to use and modify.
# Discord_bb
