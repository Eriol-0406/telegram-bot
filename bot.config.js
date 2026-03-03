/**
 * Central bot configuration — override via .env
 */
const botConfig = {
  // Telegram IDs — REQUIRED
  mainGroupId: process.env.MAIN_GROUP_ID || "",
  introChannelId: process.env.INTRO_CHANNEL_ID || "",
  adminGroupId: process.env.ADMIN_GROUP_ID || process.env.MAIN_GROUP_ID || "",

  // Timing (ms)
  graceMs: parseInt(process.env.GRACE_PERIOD_MS || "300000"),   // 5 min grace before restriction
  deadlineMs: parseInt(process.env.INTRO_DEADLINE_MS || "86400000"), // 24 hrs to finish

  // Intro validation
  // Primary gate: did the user post ANY message in the Intro Channel? (spec requirement)
  // Heuristic check: optional bonus — does the message loosely follow the 4-field format?
  heuristicValidation: process.env.HEURISTIC_VALIDATION === "true", // off by default per spec
  minIntroWords: parseInt(process.env.MIN_INTRO_WORDS || "20"),
  // Spec fields: who/what you do, location, fun fact, contribution
  requiredFields: ["identity", "location", "fun_fact", "contribution"],

  // Feature flags
  autoPinIntro: process.env.AUTO_PIN_INTRO === "true",
  deleteRestrictedMessages: process.env.DELETE_RESTRICTED !== "false", // default true
  kickAfterDeadline: process.env.KICK_AFTER_DEADLINE === "true",
  notifyAdminsOnJoin: process.env.NOTIFY_ADMINS !== "false", // default true

  // ── Spec-exact welcome message ──────────────────────────────────────────────
  // Source: Core Requirements §2 — must "send or closely mirror" this message
  defaultWelcomeMessage:
`👋 Welcome to Superteam MY, {name}!

To get started, please introduce yourself in {introChannelLink} in this format 👇
This helps everyone get context and makes collaboration easier.

*Intro format:*
• Who are you & what do you do?
• Where are you based?
• One fun fact about you
• How are you looking to contribute to Superteam MY?

No pressure to be perfect — just be you! 🙌

_Until you post your intro, your messages in the main group will be removed._`,

  // ── Spec example intro (shown in DM and via /example command) ──────────────
  // Source: Core Requirements §5
  exampleIntro:
`✨ *Example intro*

Hey everyone! I'm Marianne 👋
Together with Han, we are Co-Leads of Superteam Malaysia!

📍 Based in Kuala Lumpur and Network School
🧑‍🎓 Fun fact: My first Solana project was building an AI Telegram trading bot, and that's how I found myself in Superteam MY!

🤝 Looking to contribute by:
• Connecting builders with the right mentors, partners, and opportunities
• Helping teams refine their story, demos, and go-to-market
• Supporting members who want to go from "building quietly" → "shipping publicly"

Excited to build alongside all of you — feel free to reach out anytime 🙌`,
};

// Validate critical env vars on startup
function validateConfig() {
  const missing = [];
  if (!process.env.BOT_TOKEN) missing.push("BOT_TOKEN");
  if (!process.env.MAIN_GROUP_ID) missing.push("MAIN_GROUP_ID");
  if (!process.env.INTRO_CHANNEL_ID) missing.push("INTRO_CHANNEL_ID");

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(", ")}\nSee .env.example for reference.`
    );
  }
}

module.exports = { botConfig, validateConfig };
