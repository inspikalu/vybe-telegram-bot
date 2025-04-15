import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { CustomContext } from "../../lib/types";
import { Markup } from "telegraf";

export async function tokenHoldersTSCommand(ctx: CustomContext) {
  const tokenAddress = await requireArgs(
    ctx,
    "/token_holder_ts",
    "⚠️ Please provide a valid token address after the command. Example: `/token_holder_ts <token_mint_address>`"
  );
  if (!tokenAddress) return;

  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      "🔄 Fetching token holders time series data, please hold on...",
      {
        parse_mode: "HTML",
      }
    );

    // Default to last 30 days with daily intervals
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (30 * 24 * 60 * 60); // 30 days ago

    const response = await api.getTokenHoldersTS(tokenAddress, {
      startTime,
      endTime,
      interval: "day",
      limit: 30,
      page: 0,
    });

    if (!response || !response.data || response.data.length === 0) {
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        undefined,
        `😔 No token holders time series data found for address: <code>${tokenAddress}</code>. Please ensure the address is correct and try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Store data in session for pagination
    ctx.session = ctx.session || {};
    ctx.session.holdersTSData = response.data;
    ctx.session.holdersTSPage = 0;
    ctx.session.tokenAddress = tokenAddress;

    const { message, keyboard } = formatTokenHoldersTSData(
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
    console.error("Error in tokenHoldersTSCommand:", error);
    await ctx.reply(
      "❌ An error occurred while fetching token holders time series data. Please try again later."
    );
  }
}

export function formatTokenHoldersTSData(
  data: any[],
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
  let message = `<b>📊 Token Holders Time Series</b>\n`;
  message += `<code>${tokenAddress}</code>\n\n`;

  // Format each data point
  currentPageData.forEach((item, index) => {
    // Convert Unix timestamp to readable date and time
    const date = new Date(item.holdersTimestamp * 1000);
    const formattedDate = date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    message += `<b>📅 ${formattedDate}</b>\n`;
    message += `⏱️ Timestamp: ${item.holdersTimestamp}\n`;
    message += `👥 Holders: ${item.nHolders.toLocaleString()}\n`;

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
      ? Markup.button.callback("⬅️ Previous", "holders_ts_page:prev")
      : Markup.button.callback("🔘", "noop"),
    page < totalPages - 1
      ? Markup.button.callback("Next ➡️", "holders_ts_page:next")
      : Markup.button.callback("🔘", "noop"),
  ]);

  return { message, keyboard };
} 