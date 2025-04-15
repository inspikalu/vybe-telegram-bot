import { Markup, Scenes } from "telegraf";
import { CustomContext } from "../lib/types";
import { api } from "../lib/api";
import { BaseWizardScene } from "../lib/components/baseWizard";
import { createPaginationKeyboard, setupPaginationHandlers } from "../lib/components/pagination";
import { formatDate, formatNumber, formatUSD, createSeparator } from "../lib/utils/formatting";

// Regular expression for validating Solana addresses
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Validate interval
const validIntervals = ["hour", "day", null];

// Number of items per page
export const VOLUME_PER_PAGE = 5;

class TokenVolumeWizard extends BaseWizardScene {
  private readonly step1 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    // If this is a callback query, don't process it as a step input
    if (ctx.callbackQuery) {
      return ctx.wizard;
    }

    await ctx.replyWithHTML("Enter the <b>token mint address</b>:");
    return ctx.wizard.next();
  };

  private readonly step2 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    // If this is a callback query, don't process it as a step input
    if (ctx.callbackQuery) {
      return ctx.wizard;
    }

    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    const text = ctx.message.text.trim();
    if (!solanaAddressRegex.test(text)) {
      await ctx.reply("❌ Invalid token mint address. Please enter a valid Solana address.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    ctx.session.tokenVolumeFilters = ctx.session.tokenVolumeFilters || {};
    ctx.session.tokenVolumeFilters.mintAddress = text;

    await ctx.replyWithHTML(
      "Would you like to specify additional parameters?\n" +
      "1. Start time (Unix timestamp)\n" +
      "2. End time (Unix timestamp)\n" +
      "3. Interval (e.g., 'hour', 'day')\n" +
      "4. Skip to results\n" +
      "5. Cancel",
      Markup.keyboard([
        ["1. Start time"],
        ["2. End time"],
        ["3. Interval"],
        ["4. Skip to results"],
        ["5. Cancel"],
      ])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  };

  private readonly step3 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    // If this is a callback query, don't process it as a step input
    if (ctx.callbackQuery) {
      return ctx.wizard;
    }

    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }
  
    const choice = ctx.message.text;
    if (choice === "5. Cancel") {
      await ctx.reply("Operation cancelled.");
      await ctx.scene.leave();
      return ctx.wizard;
    }
  
    if (choice === "4. Skip to results") {
      return this.step5(ctx); // Skip directly to results
    }
  
    ctx.session.tokenVolumeFilters = ctx.session.tokenVolumeFilters || {};
    ctx.session.tokenVolumeFilters.currentParam = choice;
  
    await ctx.reply(
      `Please enter the value for ${choice}:`,
      Markup.keyboard([["Cancel"]])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  };
  
  private readonly step4 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    // If this is a callback query, don't process it as a step input
    if (ctx.callbackQuery) {
      return ctx.wizard;
    }

    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }
  
    const value = ctx.message.text;
    
    if (value === "Cancel") {
      // Return to parameter selection menu
      await ctx.replyWithHTML(
        "Would you like to specify additional parameters?\n" +
        "1. Start time (Unix timestamp)\n" +
        "2. End time (Unix timestamp)\n" +
        "3. Interval (e.g., 'hour', 'day')\n" +
        "4. Skip to results\n" +
        "5. Cancel",
        Markup.keyboard([
          ["1. Start time"],
          ["2. End time"],
          ["3. Interval"],
          ["4. Skip to results"],
          ["5. Cancel"],
        ])
          .oneTime()
          .resize()
      );
      return ctx.wizard.back();
    }
  
    const filters = ctx.session.tokenVolumeFilters || {};
    const param = filters.currentParam;
  
    switch (param) {
      case "1. Start time":
        filters.startTime = parseInt(value);
        break;
      case "2. End time":
        filters.endTime = parseInt(value);
        break;
      case "3. Interval":
        if (!validIntervals.includes(value)) {
          await ctx.reply("❌ Invalid interval. Please enter either 'hour' or 'day'.");
          return ctx.wizard.selectStep(ctx.wizard.cursor);
        }
        filters.interval = value;
        break;
    }
  
    // After saving the parameter, show the menu again
    await ctx.replyWithHTML(
      "Would you like to specify additional parameters?\n" +
      "1. Start time (Unix timestamp)\n" +
      "2. End time (Unix timestamp)\n" +
      "3. Interval (e.g., 'hour', 'day')\n" +
      "4. Skip to results\n" +
      "5. Cancel",
      Markup.keyboard([
        ["1. Start time"],
        ["2. End time"],
        ["3. Interval"],
        ["4. Skip to results"],
        ["5. Cancel"],
      ])
        .oneTime()
        .resize()
    );
    return ctx.wizard.back(); // Go back to step3 to handle the next parameter selection
  };

  private readonly step5 = async (ctx: CustomContext): Promise<Scenes.WizardContextWizard<CustomContext>> => {
    // If this is a callback query, don't process it as a step input
    if (ctx.callbackQuery) {
      return ctx.wizard;
    }

    try {
      const filters = ctx.session.tokenVolumeFilters || {};
      const { mintAddress, startTime, endTime, interval } = filters;
      
      if (!mintAddress) {
        await ctx.reply("Token mint address is required.");
        return ctx.wizard.next();
      }
      
      // Show parameter summary
      let summary = "📊 Token Volume Parameters:\n\n";
      summary += `Token: ${mintAddress}\n`;
      if (startTime) summary += `Start Time: ${new Date(startTime * 1000).toLocaleString()}\n`;
      if (endTime) summary += `End Time: ${new Date(endTime * 1000).toLocaleString()}\n`;
      if (interval) summary += `Interval: ${interval}\n`;
      summary += `\nFetching data...\n\n`;
      
      await ctx.reply(summary);
      
      const response = await api.getTokenTransferVolume(mintAddress, {
        startTime,
        endTime,
        interval,
        page: 0,
        limit: VOLUME_PER_PAGE,
      });

      if (!response.data || response.data.length === 0) {
        await ctx.reply("No volume data found for the specified parameters.");
        return ctx.wizard.next();
      }

      ctx.session.tokenVolumeData = response.data;
      ctx.session.tokenVolumePage = 0;
      await sendTokenVolumePage(ctx);
      await ctx.scene.leave();
      return ctx.wizard.next();
  
    } catch (error) {
      console.error("Error fetching token volume:", error);
      await ctx.reply("An error occurred while fetching token volume data.");
      await ctx.scene.leave();
      return ctx.wizard.next();
    }
  };

  constructor() {
    super("token-volume-wizard", [
      (ctx) => this.step1(ctx),
      (ctx) => this.step2(ctx),
      (ctx) => this.step3(ctx),
      (ctx) => this.step4(ctx),
      (ctx) => this.step5(ctx),
    ]);
  }
}

export const tokenVolumeWizard = new TokenVolumeWizard();

export async function sendTokenVolumePage(ctx: CustomContext) {
  if (!ctx.session.tokenVolumeData) return;

  const data = ctx.session.tokenVolumeData;
  const currentPage = ctx.session.tokenVolumePage || 0;
  const totalPages = Math.ceil(data.length / VOLUME_PER_PAGE);

  const startIndex = currentPage * VOLUME_PER_PAGE;
  const endIndex = Math.min(startIndex + VOLUME_PER_PAGE, data.length);
  const pageData = data.slice(startIndex, endIndex);

  const message = formatTokenVolumeMessage(pageData, currentPage, totalPages);
  const keyboard = createPaginationKeyboard({
    currentPage: currentPage + 1,
    totalPages,
    callbackPrefix: "token_volume",
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

function formatTokenVolumeMessage(
  data: any[],
  currentPage: number,
  totalPages: number
): string {
  if (data.length === 0) {
    return "❌ No volume data found for the given parameters.";
  }

  const separator = createSeparator();
  const formatted = data
    .map((item) => {
      return `📊 <b>Volume Data</b>
🕒 Time: ${formatDate(item.timeBucketStart)}
💰 Amount: ${formatNumber(item.amount)}
💵 Volume: ${formatUSD(item.volume)}`;
    })
    .join(`\n\n${separator}\n\n`);

  return `<b>📈 Token Volume</b>
${separator}
${formatted}
${separator}
📄 Showing ${currentPage + 1} of ${totalPages} pages`;
} 