import { Context, Markup } from "telegraf";
import { connectDb, Portfolio } from "../../lib/db";
import { getWalletBalancesSummary } from "../../lib/api"; // You may need to implement this helper

// /add_wallet <address>
export const addWalletCommand = async (ctx: Context) => {
  await connectDb();
  const userId = String(ctx.from?.id);
  if (!ctx.message || !("text" in ctx.message)) {
    await ctx.reply("❌ This command must be used in a text message.");
    return;
  }
  const address = ctx.message?.text?.split(" ")[1];
  if (!address)
    return ctx.reply(
      "Please provide a wallet address. Usage: /add_wallet <address>"
    );
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) portfolio = new Portfolio({ userId, wallets: [] });
  if (portfolio.wallets.includes(address))
    return ctx.reply("Wallet already in your portfolio.");
  portfolio.wallets.push(address);
  portfolio.updatedAt = new Date();
  await portfolio.save();
  ctx.reply(`Wallet ${address} added to your portfolio.`);
};

// /remove_wallet <address>
export const removeWalletCommand = async (ctx: Context) => {
  await connectDb();
  const userId = String(ctx.from?.id);
  if (!ctx.message || !("text" in ctx.message)) {
    await ctx.reply("❌ This command must be used in a text message.");
    return;
  }
  const address = ctx.message?.text?.split(" ")[1];
  if (!address)
    return ctx.reply(
      "Please provide a wallet address. Usage: /remove_wallet <address>"
    );
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio || !portfolio.wallets.includes(address))
    return ctx.reply("Wallet not found in your portfolio.");
  portfolio.wallets = portfolio.wallets.filter((w: string) => w !== address);
  portfolio.updatedAt = new Date();
  await portfolio.save();
  ctx.reply(`Wallet ${address} removed from your portfolio.`);
};

// /my_wallets with inline keyboard for remove
export const myWalletsCommand = async (ctx: Context) => {
  await connectDb();
  const userId = String(ctx.from?.id);
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio || portfolio.wallets.length === 0)
    return ctx.reply("You have no wallets saved.");
  const buttons = portfolio.wallets.map((w: string) => [Markup.button.callback(`❌ Remove`, `remove_wallet_${w}`)]);
  ctx.reply(
    `Your wallets:\n${portfolio.wallets.map((w: string, i: number) => `${i + 1}. <code>${w}</code>`).join("\n")}`,
    { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) }
  );
};

// /portfolio
export const portfolioCommand = async (ctx: Context) => {
  await connectDb();
  const userId = String(ctx.from?.id);
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio || portfolio.wallets.length === 0)
    return ctx.reply("You have no wallets saved.");
  ctx.reply("Fetching portfolio summary...");
  // You need to implement getWalletBalancesSummary to fetch and aggregate balances
  try {
    const summary = await getWalletBalancesSummary(portfolio.wallets);
    ctx.reply(summary, { parse_mode: "HTML" });
  } catch (e) {
    ctx.reply("Error fetching portfolio summary.");
  }
};
