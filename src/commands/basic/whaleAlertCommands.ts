import { connectDb, WhaleAlert } from "../../lib/db";
import { CustomContext } from "../../lib/types";

export async function setWhaleAlertCommand(ctx: CustomContext) {
  if (!ctx.message || !("text" in ctx.message)) {
    await ctx.reply("❌ This command must be used in a text message.");
    return;
  }
  const args = ctx.message?.text?.split(" ") || [];
  if (args.length < 3) {
    await ctx.reply("Usage: /set_whale_alert <token_mint> <usd_threshold>");
    return;
  }
  const tokenMint = args[1];
  const thresholdUsd = parseFloat(args[2]);
  if (!tokenMint || isNaN(thresholdUsd) || thresholdUsd <= 0) {
    await ctx.reply(
      "Invalid arguments. Example: /set_whale_alert <token_mint> 10000"
    );
    return;
  }
  await connectDb();
  await WhaleAlert.findOneAndUpdate(
    { userId: String(ctx.from?.id), tokenMint },
    {
      userId: String(ctx.from?.id),
      chatId: String(ctx.chat?.id),
      tokenMint,
      thresholdUsd,
    },
    { upsert: true }
  );
  await ctx.reply(
    `✅ Whale alert set for token ${tokenMint} at $${thresholdUsd} USD.`
  );
}

export async function deleteWhaleAlertCommand(ctx: CustomContext) {
  if (!ctx.message || !("text" in ctx.message)) {
    await ctx.reply("❌ This command must be used in a text message.");
    return;
  }
  const args = ctx.message?.text?.split(" ") || [];
  if (args.length < 2) {
    await ctx.reply("Usage: /delete_whale_alert <token_mint>");
    return;
  }
  const tokenMint = args[1];
  await connectDb();
  const res = await WhaleAlert.deleteOne({
    userId: String(ctx.from?.id),
    tokenMint,
  });
  if (res.deletedCount) {
    await ctx.reply(`🗑️ Whale alert for token ${tokenMint} deleted.`);
  } else {
    await ctx.reply(`No whale alert found for token ${tokenMint} to delete.`);
  }
}

export async function myAlertsCommand(ctx: CustomContext) {
  await connectDb();
  const alerts = await WhaleAlert.find({ userId: String(ctx.from?.id) });
  if (!alerts.length) {
    await ctx.reply("You have no active whale alerts.");
    return;
  }
  let msg = "<b>Your Whale Alerts:</b>\n";
  for (const alert of alerts) {
    msg += `• <code>${alert.tokenMint}</code> at <b>$${alert.thresholdUsd}</b>\n`;
  }
  await ctx.reply(msg, { parse_mode: "HTML" });
}
