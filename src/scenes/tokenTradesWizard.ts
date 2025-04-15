// scenes/tokenTradesWizard.ts
import { Markup, Scenes } from "telegraf";
import { CustomContext } from "../lib/types";
import { api } from "../lib/api";
import { TokenTrade } from "../lib/types/api";
import { BaseWizardScene } from "../lib/components/baseWizard";
import { createPaginationKeyboard, setupPaginationHandlers } from "../lib/components/pagination";
import { formatDate, shortenAddress, formatNumber, formatUSD, createSeparator } from "../lib/utils/formatting";

// Regular expression for validating Solana addresses
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Validate resolution
const validResolutions = ["1h", "1d", "1w", "1m", "1y"];

// Number of trades per page
export const TRADES_PER_PAGE = 5;

class TokenTradesWizard extends BaseWizardScene {
  private readonly step1 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    await ctx.replyWithHTML("Enter the <b>base mint address</b> (or type 'skip'):");
    return ctx.wizard.next();
  };

  private readonly step2 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    const isValid = await this.handleSkipOrInput(
      ctx,
      text,
      "base mint address",
      (input) => solanaAddressRegex.test(input),
      "❌ Invalid base mint address. Please enter a valid Solana address."
    );

    if (!isValid) return ctx.wizard.selectStep(ctx.wizard.cursor);

    if (text.toLowerCase() !== "skip") {
      ctx.session.tokenTradesFilters = ctx.session.tokenTradesFilters || {};
      ctx.session.tokenTradesFilters.baseMintAddress = text;
    }

    await ctx.replyWithHTML("Enter the <b>quote mint address</b> (or type 'skip'):");
    return ctx.wizard.next();
  };

  private readonly step3 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    const isValid = await this.handleSkipOrInput(
      ctx,
      text,
      "quote mint address",
      (input) => solanaAddressRegex.test(input),
      "❌ Invalid quote mint address. Please enter a valid Solana address."
    );

    if (!isValid) return ctx.wizard.selectStep(ctx.wizard.cursor);

    if (text.toLowerCase() !== "skip") {
      ctx.session.tokenTradesFilters = ctx.session.tokenTradesFilters || {};
      ctx.session.tokenTradesFilters.quoteMintAddress = text;
    }

    await ctx.replyWithHTML("Enter <b>resolution</b> (e.g. 1h, 1d) or type 'skip':");
    return ctx.wizard.next();
  };

  private readonly step4 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    const isValid = await this.handleSkipOrInput(
      ctx,
      text,
      "resolution",
      (input) => validResolutions.includes(input),
      "❌ Invalid resolution. Please enter a valid resolution (e.g., 1h, 1d, 1w, 1m, 1y)."
    );

    if (!isValid) return ctx.wizard.selectStep(ctx.wizard.cursor);

    if (text.toLowerCase() !== "skip") {
      ctx.session.tokenTradesFilters = ctx.session.tokenTradesFilters || {};
      ctx.session.tokenTradesFilters.resolution = text;
    }

    await this.showFilterSummary(ctx, "Token Trades", {
      Base: ctx.session.tokenTradesFilters?.baseMintAddress,
      Quote: ctx.session.tokenTradesFilters?.quoteMintAddress,
      Resolution: ctx.session.tokenTradesFilters?.resolution,
    });

    try {
      const response = await api.getTokenTrades(ctx.session.tokenTradesFilters || {});
      ctx.session.tokenTradesData = response.data;
      ctx.session.tokenTradesPage = 0;
      await sendTokenTradesPage(ctx);
    } catch (error) {
      console.error("Error fetching token trades:", error);
      await ctx.reply("❌ Something went wrong while fetching the data. Please try again later.");
    }

    await ctx.scene.leave();
    return ctx.wizard.next();
  };

  constructor() {
    super("token-trades-wizard", [
      (ctx) => this.step1(ctx),
      (ctx) => this.step2(ctx),
      (ctx) => this.step3(ctx),
      (ctx) => this.step4(ctx),
    ]);
  }
}

export const tokenTradesWizard = new TokenTradesWizard();

export async function sendTokenTradesPage(ctx: CustomContext) {
  if (!ctx.session.tokenTradesData) return;

  const trades = ctx.session.tokenTradesData;
  const currentPage = ctx.session.tokenTradesPage || 0;
  const totalPages = Math.ceil(trades.length / TRADES_PER_PAGE);

  const startIndex = currentPage * TRADES_PER_PAGE;
  const endIndex = Math.min(startIndex + TRADES_PER_PAGE, trades.length);
  const pageTradesData = trades.slice(startIndex, endIndex);

  const message = formatTokenTradesMessage(pageTradesData, currentPage, totalPages);
  const keyboard = createPaginationKeyboard({
    currentPage: currentPage + 1,
    totalPages,
    callbackPrefix: "token_trades",
  });

  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(keyboard),
    });
    await ctx.answerCbQuery();
  } else {
    await ctx.reply(message, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(keyboard),
    });
  }
}

function formatTokenTradesMessage(
  trades: TokenTrade[],
  currentPage: number,
  totalPages: number
): string {
  if (trades.length === 0) {
    return "❌ No recent trades found for the given parameters.";
  }

  const separator = createSeparator();
  const formatted = trades
    .map((trade) => {
      return `📊 <b>Trade on ${trade.marketId}</b>
🔁 ${formatNumber(trade.baseSize)} → ${formatNumber(trade.quoteSize)}
💸 Price: ${formatNumber(trade.price)} ${shortenAddress(trade.quoteMintAddress)}/token
🕒 Time: ${formatDate(trade.blockTime)}
🔗 Tx: <a href="https://solscan.io/tx/${trade.signature}">View Transaction</a>`;
    })
    .join(`\n\n${separator}\n\n`);

  return `<b>📈 Recent Trades</b>
${separator}
${formatted}
${separator}
📄 Showing ${currentPage + 1} of ${totalPages} pages`;
}

export function setupTokenTradesPagination(bot: any) {
  setupPaginationHandlers(bot, "token_trades", async (ctx: CustomContext, page: number) => {
    if (ctx.session.tokenTradesData) {
      const totalPages = Math.ceil(ctx.session.tokenTradesData.length / TRADES_PER_PAGE);
      if (page >= 1 && page <= totalPages) {
        ctx.session.tokenTradesPage = page - 1;
        await sendTokenTradesPage(ctx);
      }
    }
  });
}
