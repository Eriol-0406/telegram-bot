/**
 * newMember.handler — fires when someone joins the main group.
 */
const storage = require("../services/storage.service");
const { restrictUser } = require("../services/permissions.service");
const { botConfig } = require("../config/bot.config");
const { buildWelcomeMessage } = require("../utils/templates");
const { notifyAdmins } = require("../utils/adminNotifier");
const logger = require("../utils/logger");

const handleNewMembers = async (ctx) => {
  // Only care about the main group
  if (String(ctx.chat.id) !== String(process.env.MAIN_GROUP_ID)) return;

  for (const newMember of ctx.message.new_chat_members) {
    // Skip bots
    if (newMember.is_bot) continue;

    const userId = newMember.id;
    const firstName = newMember.first_name || "New Member";
    const username = newMember.username || null;
    const now = Date.now();

    logger.info(`👤 New member: ${firstName} (${userId})`);

    // ── 1. Persist the member ──────────────────────────────────────────────
    storage.addMember({ userId, username, firstName, joinedAt: now });

    // ── 2. Restrict them immediately ──────────────────────────────────────
    await restrictUser(ctx.telegram, ctx.chat.id, userId);

    // ── 3. Send a welcome message in the group ────────────────────────────
    const introChannelLink = process.env.INTRO_CHANNEL_LINK
      ? `[Intro Channel](${process.env.INTRO_CHANNEL_LINK})`
      : "the Intro Channel";

    const customWelcome = storage.getConfig("welcomeMessage");
    const welcomeText = buildWelcomeMessage(customWelcome || botConfig.defaultWelcomeMessage, {
      name: `[${firstName}](tg://user?id=${userId})`,
      introChannelLink,
    });

    const welcomeMsg = await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📝 Go to Intro Channel",
              url: process.env.INTRO_CHANNEL_LINK || "https://t.me",
            },
            {
              text: "❓ Contact Admin",
              callback_data: `contact_admin:${userId}`,
            },
          ],
        ],
      },
    });

    // ── 4. Also DM the new member ──────────────────────────────────────────
    try {
      await ctx.telegram.sendMessage(
        userId,
        // Spec §2: send or closely mirror this exact message
        `👋 Welcome to Superteam MY, ${firstName}!\n\n` +
          `To get started, please introduce yourself in ${process.env.INTRO_CHANNEL_LINK ? process.env.INTRO_CHANNEL_LINK : "the Intro Channel"} in this format 👇\n` +
          `This helps everyone get context and makes collaboration easier.\n\n` +
          `*Intro format:*\n` +
          `• Who are you & what do you do?\n` +
          `• Where are you based?\n` +
          `• One fun fact about you\n` +
          `• How are you looking to contribute to Superteam MY?\n\n` +
          `No pressure to be perfect — just be you! 🙌\n\n` +
          `_Your messages in the main group will be removed until you post your intro._`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📝 Go to Intro Channel",
                  url: process.env.INTRO_CHANNEL_LINK || "https://t.me",
                },
                {
                  text: "✨ See Example Intro",
                  callback_data: `show_example:${userId}`,
                },
              ],
            ],
          },
        }
      );
    } catch {
      // DM may fail if user has privacy settings enabled — not critical
      logger.warn(`Could not DM new member ${userId} — privacy settings may be blocking it.`);
    }

    // ── 5. Notify admins (optional) ────────────────────────────────────────
    if (botConfig.notifyAdminsOnJoin) {
      await notifyAdmins(ctx.telegram, {
        text: `🆕 New member: *${firstName}* (${username ? `@${username}` : `ID: ${userId}`}) joined the group. Awaiting intro.`,
      });
    }

    // ── 6. Schedule deadline reminder (halfway through) ───────────────────
    const halfDeadline = botConfig.deadlineMs / 2;
    setTimeout(async () => {
      const member = storage.getMember(userId);
      if (member && !member.introCompleted) {
        storage.data.members[userId].reminderSent = true;
        storage.data.members[userId];
        try {
          await ctx.telegram.sendMessage(
            userId,
            `⏰ *Reminder:* You have 12 hours left to post your intro in the Intro Channel or you may be removed from the group.`,
            { parse_mode: "Markdown" }
          );
        } catch {
          // DM blocked — send in group instead
          const reminder = await ctx.telegram.sendMessage(
            ctx.chat.id,
            `⏰ [${firstName}](tg://user?id=${userId}), your intro deadline is approaching! Please post in the Intro Channel.`,
            { parse_mode: "Markdown" }
          );
          setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, reminder.message_id).catch(() => {}), 60_000);
        }
      }
    }, halfDeadline);

    // ── 7. Kick after deadline if enabled ─────────────────────────────────
    if (botConfig.kickAfterDeadline) {
      const { kickUser } = require("../services/permissions.service");
      setTimeout(async () => {
        const member = storage.getMember(userId);
        if (member && !member.introCompleted) {
          await kickUser(ctx.telegram, ctx.chat.id, userId);
          storage.removeMember(userId);
          logger.info(`👢 Auto-kicked ${userId} after deadline.`);
          await notifyAdmins(ctx.telegram, {
            text: `👢 Auto-kicked *${firstName}* (ID: ${userId}) — did not complete intro within 24 hours.`,
          });
        }
      }, botConfig.deadlineMs);
    }
  }
};

module.exports = { handleNewMembers };
