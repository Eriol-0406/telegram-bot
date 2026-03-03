/**
 * intro.handler — detects intro posts in the Intro Channel and unlocks access.
 *
 * Primary completion gate (spec §3):
 *   The user has posted at least one message in the Intro Channel.
 *
 * Optional heuristic (spec §3 bonus, enabled via HEURISTIC_VALIDATION=true):
 *   The message loosely matches the 4-field format. If it fails, the bot
 *   gives friendly feedback but does NOT hard-block — the member is still
 *   marked introduced after a short grace window so they aren't stuck.
 */
const storage = require("../services/storage.service");
const { unrestrict, pinMessage } = require("../services/permissions.service");
const { heuristicCheck } = require("../services/introValidator.service");
const { botConfig } = require("../config/bot.config");
const { notifyAdmins } = require("../utils/adminNotifier");
const logger = require("../utils/logger");

const handleIntroSubmission = async (ctx, next) => {
  // Only act in the Intro Channel
  if (!ctx.isIntroChannel) return next();

  // Ignore bots
  if (!ctx.from || ctx.from.is_bot) return next();

  const userId = ctx.from.id;
  const text = ctx.message?.text || ctx.message?.caption || "";
  const firstName = ctx.from.first_name || "there";
  const member = storage.getMember(userId);

  // ── Already verified — nothing to do ──────────────────────────────────────
  if (member?.introCompleted) return next();

  // ── Optional heuristic check (bonus feature, off by default) ──────────────
  if (botConfig.heuristicValidation) {
    const { looksLikeIntro, suggestions } = heuristicCheck(text);

    if (!looksLikeIntro) {
      // Give friendly nudge — but still accept after 10 minutes to avoid blocking
      const nudge = await ctx.reply(
        `👀 Hey ${firstName}! Your message looks a bit short for an intro.\n\n` +
          `To help others get to know you, try covering:\n` +
          suggestions.map((s) => `• ${s}`).join("\n") +
          `\n\n_No pressure to be perfect — just be you! If you've said what you want, your access will unlock shortly._`,
        { parse_mode: "Markdown", reply_to_message_id: ctx.message.message_id }
      );

      // Soft accept after 10 minutes regardless — don't permanently block on heuristic
      setTimeout(() => {
        ctx.telegram.deleteMessage(ctx.chat.id, nudge.message_id).catch(() => {});
        _completeIntro(ctx, userId, firstName, text);
      }, 10 * 60 * 1000);

      return;
    }
  }

  // ── Primary gate: any message in the intro channel = introduced ────────────
  await _completeIntro(ctx, userId, firstName, text);
};

/**
 * Mark a member as introduced, unrestrict them, and celebrate.
 */
async function _completeIntro(ctx, userId, firstName, introText) {
  // Idempotency guard — could be called from the timeout path
  const current = storage.getMember(userId);
  if (current?.introCompleted) return;

  // Upsert: handle members who joined before the bot was running
  if (!current) {
    storage.addMember({
      userId,
      username: ctx.from?.username || null,
      firstName,
      joinedAt: Date.now(),
    });
  }

  storage.markIntroComplete(userId, {
    messageId: ctx.message?.message_id || null,
    introText: introText.slice(0, 500),
  });

  // Unrestrict in the main group
  await unrestrict(ctx.telegram, process.env.MAIN_GROUP_ID, userId);

  // Auto-pin if configured
  if (botConfig.autoPinIntro && ctx.message?.message_id) {
    await pinMessage(ctx.telegram, ctx.chat.id, ctx.message.message_id);
  }

  // ── Congratulate in the intro channel ─────────────────────────────────────
  const congrats = await ctx.reply(
    `✅ Thanks for introducing yourself, *${firstName}*!\n\n` +
      `You're all set — your access to the main group has been unlocked. Welcome to Superteam MY! 🎉`,
    {
      parse_mode: "Markdown",
      ...(ctx.message?.message_id ? { reply_to_message_id: ctx.message.message_id } : {}),
    }
  );

  // Auto-delete congrats after 2 min to keep the channel clean
  setTimeout(() => {
    ctx.telegram.deleteMessage(congrats.chat.id, congrats.message_id).catch(() => {});
  }, 2 * 60 * 1000);

  // ── Welcome announcement in main group ────────────────────────────────────
  try {
    const mention = ctx.from?.username
      ? `@${ctx.from.username}`
      : `[${firstName}](tg://user?id=${userId})`;

    await ctx.telegram.sendMessage(
      process.env.MAIN_GROUP_ID,
      `👏 Say hello to *${firstName}* (${mention}) — they just introduced themselves! Welcome to the community 🙌`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    logger.warn("Could not post welcome announcement in main group:", err.message);
  }

  // ── Notify admins ──────────────────────────────────────────────────────────
  await notifyAdmins(ctx.telegram, {
    text: `✅ *${firstName}* (ID: ${userId}) completed their intro and has been verified.`,
  });

  logger.info(`✅ User ${userId} (${firstName}) verified after intro post.`);
}

module.exports = { handleIntroSubmission };

