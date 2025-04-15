import { Markup } from "telegraf";
import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { CustomContext } from "../../lib/types";

// Define a type for the OHLCV data entry
interface OHLCVData {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  volumeUsd: string;
  count: number;
}

export async function tokenOHLCVCommand(ctx: CustomContext) {
  const tokenAddress = await requireArgs(
    ctx,
    "/token_ohlcv",
    "⚠️ Please provide a valid token address after the command. Example: `/token_ohlcv <token_mint_address>`"
  );
  if (!tokenAddress) return;
  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      "🔄 Fetching token OHLCV data, please hold on...",
      {
        parse_mode: "HTML",
      }
    );

    const response = await api.getTokenOHLCV(tokenAddress);
    console.log("Token OHLCV:", response);

    if (!response || !response.data || response.data.length === 0) {
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        undefined,
        `😔 No token OHLCV data found for address: <code>${tokenAddress}</code>. Please ensure the address is correct and try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Store data in session for pagination
    ctx.session = ctx.session || {};
    ctx.session.ohlcvData = response.data;
    ctx.session.ohlcvPage = 0;
    ctx.session.tokenAddress = tokenAddress;

    const { message, keyboard } = formatTokenOHLCVData(
      response.data,
      tokenAddress,
      0
    );

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      undefined,
      message,
      {
        parse_mode: "HTML",
        ...keyboard,
      }
    );
  } catch (error) {
    console.error("Error in tokenOHLCVCommand:", error);
    await ctx.reply(
      "❌ An error occurred while fetching token OHLCV data. Please try again later."
    );
  }
}

// Handle pagination callbacks

export function formatTokenOHLCVData(
  data: OHLCVData[],
  tokenAddress: string,
  page: number = 0
): { message: string; keyboard: any } {
  // Display 5 items per page
  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = page * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const currentPageData = data.slice(startIndex, endIndex);

  // Format header
  let message = `<b>📊 OHLCV Data for Token</b>\n`;
  message += `<code>${tokenAddress}</code>\n\n`;

  // Format each data point
  currentPageData.forEach((item, index) => {
    // Convert Unix timestamp to readable date
    const date = new Date(item.time * 1000);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Format prices with limited decimal places
    const open = parseFloat(item.open).toFixed(4);
    const high = parseFloat(item.high).toFixed(4);
    const low = parseFloat(item.low).toFixed(4);
    const close = parseFloat(item.close).toFixed(4);

    // Format volume with K/M/B suffixes
    const volume = formatLargeNumber(parseFloat(item.volume));
    const volumeUsd = formatLargeNumber(parseFloat(item.volumeUsd));

    message += `<b>${formattedDate}</b>\n`;
    message += `Price: O: $${open} H: $${high} L: $${low} C: $${close}\n`;
    message += `Volume: ${volume} (≈$${volumeUsd})\n`;
    message += `Trades: ${item.count}\n`;

    // Add separator between items except for the last one
    if (index < currentPageData.length - 1) {
      message += `\n${"-".repeat(30)}\n\n`;
    }
  });

  // Add pagination info
  message += `\n<i>Page ${page + 1} of ${totalPages}</i>`;

  // Create pagination keyboard
  const keyboard = Markup.inlineKeyboard([
    page > 0
      ? Markup.button.callback("⬅️ Previous", "ohlcv_page:prev")
      : Markup.button.callback("🔘", "noop"),
    page < totalPages - 1
      ? Markup.button.callback("Next ➡️", "ohlcv_page:next")
      : Markup.button.callback("🔘", "noop"),
  ]);

  return { message, keyboard };
}

// Helper function to format large numbers with K/M/B suffixes
function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + "B";
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + "M";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + "K";
  } else {
    return num.toFixed(2);
  }
}
