import { Markup, Scenes } from "telegraf";
import { CustomContext } from "../lib/types";
import { api } from "../lib/api";
import { PriceData } from "../lib/types/api";
import { BaseWizardScene } from "../lib/components/baseWizard";
import { createPaginationKeyboard, setupPaginationHandlers } from "../lib/components/pagination";
import { formatDate, shortenAddress, formatNumber, createSeparator } from "../lib/utils/formatting";

// Regular expression for validating Solana addresses
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Validate resolution
const validResolutions = ["1h", "1d", "1w", "1m", "1y"];

// Number of price data points per page
const PRICE_PER_PAGE = 5;

class PriceWizard extends BaseWizardScene {
  private readonly step1 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    await ctx.replyWithHTML("Enter the <b>base mint address</b>:");
    return ctx.wizard.next();
  };

  private readonly step2 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    if (!solanaAddressRegex.test(text)) {
      await ctx.reply("❌ Invalid base mint address. Please enter a valid Solana address.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    ctx.session.priceFilters = ctx.session.priceFilters || {};
    ctx.session.priceFilters.baseMintAddress = text;

    await ctx.replyWithHTML("Enter the <b>quote mint address</b>:");
    return ctx.wizard.next();
  };

  private readonly step3 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    if (!solanaAddressRegex.test(text)) {
      await ctx.reply("❌ Invalid quote mint address. Please enter a valid Solana address.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    ctx.session.priceFilters = ctx.session.priceFilters || {};
    ctx.session.priceFilters.quoteMintAddress = text;

    await ctx.replyWithHTML(
      "Would you like to specify additional parameters?\n" +
      "1. Program ID\n" +
      "2. Resolution (e.g., 1h, 1d)\n" +
      "3. Start time (Unix timestamp)\n" +
      "4. End time (Unix timestamp)\n" +
      "5. Skip to results\n" +
      "6. Cancel",
      Markup.keyboard([
        ["1. Program ID"],
        ["2. Resolution"],
        ["3. Start time"],
        ["4. End time"],
        ["5. Skip to results"],
        ["6. Cancel"],
      ])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  };

  private readonly step4 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const choice = ctx.message.text;
    if (choice === "6. Cancel") {
      await ctx.reply("Operation cancelled.");
      await ctx.scene.leave();
      return ctx.wizard;
    }

    if (choice === "5. Skip to results") {
      return this.step6(ctx); // Skip directly to results
    }

    ctx.session.priceFilters = ctx.session.priceFilters || {};
    ctx.session.priceFilters.currentParam = choice;

    let prompt = "";
    switch (choice) {
      case "1. Program ID":
        prompt = "Enter the program ID (or type 'skip'):";
        break;
      case "2. Resolution":
        prompt = "Enter the resolution (1h, 1d, 1w, 1m, 1y) (or type 'skip'):";
        break;
      case "3. Start time":
        prompt = "Enter the start time as Unix timestamp (or type 'skip'):";
        break;
      case "4. End time":
        prompt = "Enter the end time as Unix timestamp (or type 'skip'):";
        break;
    }

    await ctx.reply(prompt, Markup.keyboard([["Cancel"]]).oneTime().resize());
    return ctx.wizard.next();
  };

  private readonly step5 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    if (text.toLowerCase() === "cancel") {
      await ctx.reply("Operation cancelled.");
      await ctx.scene.leave();
      return ctx.wizard;
    }

    const filters = ctx.session.priceFilters || {};
    const currentParam = filters.currentParam;

    if (text.toLowerCase() !== "skip") {
      switch (currentParam) {
        case "1. Program ID":
          if (!solanaAddressRegex.test(text)) {
            await ctx.reply("❌ Invalid program ID. Please enter a valid Solana address.");
            return ctx.wizard.selectStep(ctx.wizard.cursor);
          }
          filters.programId = text;
          break;
        case "2. Resolution":
          if (!validResolutions.includes(text)) {
            await ctx.reply("❌ Invalid resolution. Please enter a valid resolution (1h, 1d, 1w, 1m, 1y).");
            return ctx.wizard.selectStep(ctx.wizard.cursor);
          }
          filters.resolution = text;
          break;
        case "3. Start time":
          const startTime = parseInt(text);
          if (isNaN(startTime) || startTime < 0) {
            await ctx.reply("❌ Invalid start time. Please enter a valid Unix timestamp.");
            return ctx.wizard.selectStep(ctx.wizard.cursor);
          }
          filters.timeStart = startTime;
          break;
        case "4. End time":
          const endTime = parseInt(text);
          if (isNaN(endTime) || endTime < 0) {
            await ctx.reply("❌ Invalid end time. Please enter a valid Unix timestamp.");
            return ctx.wizard.selectStep(ctx.wizard.cursor);
          }
          filters.timeEnd = endTime;
          break;
      }
    }

    // Show the parameter menu again
    await ctx.replyWithHTML(
      "Would you like to specify additional parameters?\n" +
      "1. Program ID\n" +
      "2. Resolution (e.g., 1h, 1d)\n" +
      "3. Start time (Unix timestamp)\n" +
      "4. End time (Unix timestamp)\n" +
      "5. Skip to results\n" +
      "6. Cancel",
      Markup.keyboard([
        ["1. Program ID"],
        ["2. Resolution"],
        ["3. Start time"],
        ["4. End time"],
        ["5. Skip to results"],
        ["6. Cancel"],
      ])
        .oneTime()
        .resize()
    );
    return ctx.wizard.back(); // Go back to step3 to handle the next parameter selection
  };

  private readonly step6 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    try {
      const filters = ctx.session.priceFilters || {};
      const { baseMintAddress, quoteMintAddress, programId, resolution, timeStart, timeEnd } = filters;
      
      if (!baseMintAddress || !quoteMintAddress) {
        await ctx.reply("Base and quote mint addresses are required.");
        return ctx.wizard.next();
      }
      
      // Show parameter summary
      let summary = "📊 Price Data Parameters:\n\n";
      summary += `Base Token: ${baseMintAddress}\n`;
      summary += `Quote Token: ${quoteMintAddress}\n`;
      if (programId) summary += `Program ID: ${programId}\n`;
      if (resolution) summary += `Resolution: ${resolution}\n`;
      if (timeStart) summary += `Start Time: ${new Date(timeStart * 1000).toLocaleString()}\n`;
      if (timeEnd) summary += `End Time: ${new Date(timeEnd * 1000).toLocaleString()}\n`;
      summary += `\nFetching data...\n\n`;
      
      await ctx.reply(summary);
      
      const response = await api.getPriceData(baseMintAddress, quoteMintAddress, {
        programId,
        resolution,
        timeStart,
        timeEnd,
        page: 0,
        limit: PRICE_PER_PAGE,
      });

      if (!response.data || response.data.length === 0) {
        await ctx.reply("No price data found for the specified parameters.");
        return ctx.wizard.next();
      }

      ctx.session.priceData = response.data;
      ctx.session.pricePage = 0;
      await sendPricePage(ctx);
      await ctx.scene.leave();
      return ctx.wizard.next();
  
    } catch (error) {
      console.error("Error fetching price data:", error);
      await ctx.reply("An error occurred while fetching price data.");
      await ctx.scene.leave();
      return ctx.wizard.next();
    }
  };

  constructor() {
    super("price-wizard", [
      (ctx) => this.step1(ctx),
      (ctx) => this.step2(ctx),
      (ctx) => this.step3(ctx),
      (ctx) => this.step4(ctx),
      (ctx) => this.step5(ctx),
      (ctx) => this.step6(ctx),
    ]);
  }
}

export const priceWizard = new PriceWizard();

export async function sendPricePage(ctx: CustomContext) {
  if (!ctx.session.priceData) return;

  const priceData = ctx.session.priceData;
  const currentPage = ctx.session.pricePage || 0;
  const totalPages = Math.ceil(priceData.length / PRICE_PER_PAGE);

  const startIndex = currentPage * PRICE_PER_PAGE;
  const endIndex = Math.min(startIndex + PRICE_PER_PAGE, priceData.length);
  const pageData = priceData.slice(startIndex, endIndex);

  const message = formatPriceMessage(pageData, currentPage, totalPages);
  const keyboard = createPaginationKeyboard({
    currentPage: currentPage + 1,
    totalPages,
    callbackPrefix: "price",
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

function formatPriceMessage(
  priceData: PriceData[],
  currentPage: number,
  totalPages: number
): string {
  if (priceData.length === 0) {
    return "❌ No price data found for the given parameters.";
  }

  const separator = createSeparator();
  const formatted = priceData
    .map((data) => {
      return `📊 <b>Price Data</b>
🕒 Time: ${formatDate(parseInt(data.time))}
💰 Open: ${formatNumber(data.open)}
💰 Close: ${formatNumber(data.close)}
📈 High: ${formatNumber(data.high)}
📉 Low: ${formatNumber(data.low)}
📊 Volume: ${formatNumber(data.volume)}
🔢 Trades: ${data.count}`;
    })
    .join(`\n\n${separator}\n\n`);

  return `<b>📈 Price Data</b>
${separator}
${formatted}
${separator}
📄 Showing ${currentPage + 1} of ${totalPages} pages`;
}

export function setupPricePagination(bot: any) {
  setupPaginationHandlers(bot, "price", async (ctx: CustomContext, page: number) => {
    if (ctx.session.priceData) {
      const totalPages = Math.ceil(ctx.session.priceData.length / PRICE_PER_PAGE);
      if (page >= 1 && page <= totalPages) {
        ctx.session.pricePage = page - 1;
        await sendPricePage(ctx);
      }
    }
  });
} 