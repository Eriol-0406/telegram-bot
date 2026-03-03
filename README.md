# 🤖 telegram Onboarding Bot

A production-ready Telegram bot that improves community quality by requiring new members to introduce themselves before they can participate in the main group.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🆕 New member detection | Instantly detects joins and restricts messaging |
| 📩 DM + group welcome | Sends a welcome both in the group and via DM |
| 📝 Intro template | Provides a structured intro template |
| ✅ Intro validation | Checks for word count and required fields |
| 🔒 Access control | Restricts main group until intro is approved |
| 🔓 Auto-unlock | Lifts restriction instantly on valid intro |
| 📌 Auto-pin | Optionally pins each intro post |
| ⏰ Deadline reminders | Sends a reminder at the halfway mark |
| 👢 Auto-kick | Kicks members who miss the deadline (configurable) |
| 👮 Admin commands | Full suite of moderation tools |
| 📊 Stats & analytics | Live onboarding conversion metrics |
| 💾 Persistent storage | JSON file (easily swappable to DB) |
| 🔔 Admin notifications | Alerts a dedicated admin group on key events |

---

## 🚀 Quick Start

### Prerequisites

- Node.js **≥ 18**
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Bot added to your **main group** and **intro channel** as an **Administrator**
  - Required permissions: Delete messages, Restrict members, Pin messages

### 1. Clone & Install

```bash
git clone https://github.com/Eriol-0406/telegram-bot.git
cd telegram-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
BOT_TOKEN=your_bot_token_here
MAIN_GROUP_ID=your_main_group_id (usually looks like /k/#-123456789)
INTRO_CHANNEL_ID=your_channel__id
INTRO_CHANNEL_LINK=https://t.me/+your_channel_invite_link
```

> 💡 **How to find a group/channel ID:** Forward a message from the group to [@userinfobot](https://t.me/userinfobot) or [@getidsbot](https://t.me/getidsbot).

### 3. Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## ⚙️ Environment Variables

### Required

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `MAIN_GROUP_ID` | Telegram ID of the main group (negative number) |
| `INTRO_CHANNEL_ID` | Telegram ID of the intro channel |
| `INTRO_CHANNEL_LINK` | Invite link to the intro channel |

### Optional

| Variable | Default | Description |
|---|---|---|
| `ADMIN_GROUP_ID` | `MAIN_GROUP_ID` | Separate admin group for bot notifications |
| `INTRO_DEADLINE_MS` | `86400000` (24h) | Deadline for completing intro |
| `GRACE_PERIOD_MS` | `300000` (5min) | Grace period before restriction |
| `MIN_INTRO_WORDS` | `30` | Minimum word count for valid intro |
| `AUTO_PIN_INTRO` | `false` | Auto-pin each intro in the intro channel |
| `DELETE_RESTRICTED` | `true` | Delete messages from unverified users |
| `KICK_AFTER_DEADLINE` | `false` | Auto-kick members who miss the deadline |
| `NOTIFY_ADMINS` | `true` | Send admin notifications on key events |
| `NODE_ENV` | `development` | Set to `production` to enable webhooks |
| `WEBHOOK_URL` | — | Your HTTPS domain (required in production) |
| `PORT` | `3000` | Port for webhook server |
| `DATA_PATH` | `./data/members.json` | Persistence file path |
| `LOG_LEVEL` | `info` | `error` \| `warn` \| `info` \| `debug` |

---

## 👮 Admin Commands

| Command | Who | Description |
|---|---|---|
| `/example` | Anyone | Show the spec example intro (Marianne's intro) |
| `/start` | Anyone (DM) | About the bot |
| `/verify <user_id>` | Admins | Manually verify a member and unlock their access |
| `/unverify <user_id>` | Admins | Revoke a member's verification and restrict them |
| `/kick <user_id>` | Admins | Kick an unverified member from the group |
| `/pending` | Admins | List all members awaiting their intro |
| `/stats` | Admins | Show onboarding statistics |
| `/setwelcome <text>` | Admins | Update the welcome message (`{name}`, `{introChannelLink}` as placeholders) |
| `/help` | Admins | Show command reference |

---

## 📋 Intro Completion Logic

Per the spec (§3), the primary completion gate is simple:

> **The user posts any message in the Intro Channel → they are marked as "introduced" and unlocked.**

This avoids false negatives and respects community culture ("no pressure to be perfect — just be you!").

### Optional Heuristic (Bonus Feature)

Enable via `HEURISTIC_VALIDATION=true`. When on, the bot checks whether the message loosely covers the 4 spec fields:

| Field | What the bot looks for |
|---|---|
| Who you are | "I'm", "I work", "developer", "I build", etc. |
| Location | "based", "from", city/country names, "KL", etc. |
| Fun fact | "fun fact", "hobby", "outside", "love", etc. |
| Contribution | "contribute", "help", "looking to", "telegram", etc. |

If suggestions are given, the member is **still unlocked after 10 minutes** — the heuristic is advisory, never a hard block.

### Intro Format (Spec §2)

```
• Who are you & what do you do?
• Where are you based?
• One fun fact about you
• How are you looking to contribute to telegram MY?
```

---

## 🏗️ Project Structure

```
telegram-onboarding-bot/
├── src/
│   ├── index.js                    # Bot entry point & middleware stack
│   ├── config/
│   │   └── bot.config.js           # Central configuration
│   ├── handlers/
│   │   ├── newMember.handler.js    # New member detection & welcome
│   │   ├── intro.handler.js        # Intro submission & verification
│   │   ├── admin.handler.js        # Admin commands
│   │   └── callback.handler.js     # Inline button callbacks
│   ├── middleware/
│   │   ├── session.middleware.js   # Session initialisation
│   │   └── restriction.middleware.js # Main group message restriction
│   ├── services/
│   │   ├── storage.service.js      # Persistent member storage
│   │   ├── permissions.service.js  # Telegram permission wrappers
│   │   └── introValidator.service.js # Intro content validation
│   └── utils/
│       ├── logger.js               # Structured logger
│       ├── adminCheck.js           # Admin status checker (with cache)
│       ├── adminNotifier.js        # Admin group notification helper
│       └── templates.js            # Welcome message template builder
├── tests/
│   └── introValidator.test.js      # Unit tests
├── data/                           # Auto-created — gitignored
│   └── members.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🐳 Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
```

```bash
docker build -t telegram-bot .
docker run -d \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  --name telegram-bot \
  telegram-bot
```

---

## ☁️ Deploy to Railway / Render / Fly.io

1. Push your repo to GitHub
2. Create a new project and connect the repo
3. Add all environment variables from `.env.example`
4. Set `NODE_ENV=production` and `WEBHOOK_URL=https://your-app-domain.com`
5. Deploy — the bot will automatically use webhooks in production

---

## 🧪 Running Tests

```bash
npm test
```

---

## 🔧 Extending the Bot

### Swap to a real database

Replace the `_load` / `_save` methods in `src/services/storage.service.js` with your preferred DB client (Postgres via `pg`, Redis via `ioredis`, etc.) — the public API stays the same.

### Add custom intro fields

Edit `FIELD_PATTERNS` and `botConfig.requiredFields` in `introValidator.service.js` and `bot.config.js` respectively.

### Custom intro template

Use `/setwelcome` at runtime, or update `defaultWelcomeMessage` in `bot.config.js`.

---

## 📄 License

MIT © Superteam
