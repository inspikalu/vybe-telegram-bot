import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { Markup } from "telegraf";
import { holdersPaginationStore as paginationStore } from "../../lib/state";
import { CustomContext } from "../../lib/types";

// Store for keeping track of pagination data
interface PaginationData {
  tokenAddress: string;
  tokenSymbol: string;
  totalCount: number;
  totalPercentage: number;
  currentPage: number;
}

// const paginationStore = new Map<number, PaginationData>();

export async function topHoldersCommand(ctx: CustomContext) {
  const tokenAddress = await requireArgs(
    ctx,
    "/top_holders",
    "⚠️ Please provide a valid token address after the command. Example: `/top_holders <token_mint_address>`"
  );
  if (!tokenAddress) return;

  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      "🔄 Fetching top holders data, please hold on...",
      {
        parse_mode: "HTML",
      }
    );

    const response = await api.getTokenTopHolders(tokenAddress);
    console.log("Top holders response count:", response?.data?.length);

    if (!response || !response.data || response.data.length === 0) {
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        undefined,
        `😔 No top holders data found for token: <code>${tokenAddress}</code>. Please ensure the token address is correct and try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Extract token information
    const tokenMint = response.data[0]?.tokenMint || "Unknown Token";
    const tokenSymbol = response.data[0]?.tokenSymbol || "Unknown";

    // Calculate total supply percentage
    const totalHeldPercentage = response.data.reduce(
      (sum: number, holder: any) => sum + (holder.percentageOfSupplyHeld || 0),
      0
    );

    // Store pagination data
    const chatId = processingMsg.chat.id;
    paginationStore.set(chatId, {
      tokenAddress,
      tokenSymbol,
      totalCount: response.data.length,
      totalPercentage: totalHeldPercentage,
      currentPage: 1,
    });

    // Format first page (top 10 holders)
    const formattedMessage = formatTopHoldersPage(response, 1, 10);

    // Create pagination buttons
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback("⬅️ Previous", "holders_prev"),
      Markup.button.callback("Next ➡️", "holders_next"),
    ]);

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      undefined,
      formattedMessage,
      {
        parse_mode: "HTML",
        ...keyboard,
      }
    );
  } catch (error) {
    console.error("Error fetching top holders:", error);
    await ctx.reply(
      "❌ Failed to fetch top holders. This could be due to an invalid token address or an issue with the API. Please try again later or check your token address."
    );
  }
}

export function formatTopHoldersPage(
  response: any,
  page: number,
  pageSize: number = 10
): string {
  // Extract token information
  const tokenMint = response.data[0]?.tokenMint || "Unknown Token";
  const tokenSymbol = response.data[0]?.tokenSymbol || "Unknown";

  // Calculate total supply percentage
  const totalHeldPercentage = response.data.reduce(
    (sum: number, holder: any) => sum + (holder.percentageOfSupplyHeld || 0),
    0
  );

  let message = `<b>👥 Top Holders for ${tokenSymbol}</b>\n`;
  message += `<b>Token:</b> <code>${tokenMint.substring(
    0,
    10
  )}...${tokenMint.substring(tokenMint.length - 4)}</code>\n\n`;
  message += `<b>Top Holders (${response.data.length}):</b>\n`;
  message += `Combined holding: ${totalHeldPercentage.toFixed(
    2
  )}% of supply\n\n`;

  // Calculate start and end indices for the current page
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, response.data.length);

  message += `<b>Showing holders ${
    startIdx + 1
  }-${endIdx} (Page ${page}/${Math.ceil(
    response.data.length / pageSize
  )})</b>\n\n`;

  // List top holders for the current page
  for (let i = startIdx; i < endIdx; i++) {
    const holder = response.data[i];
    const ownerName = holder.ownerName || "Anonymous";
    const shortAddress = `${holder.ownerAddress.substring(
      0,
      4
    )}...${holder.ownerAddress.substring(holder.ownerAddress.length - 4)}`;

    message += `<b>${i + 1}. ${ownerName}</b> (${shortAddress})\n`;
    // Round large numbers for better display
    const balance = parseFloat(holder.balance);
    const formattedBalance =
      balance > 1000000
        ? `${(balance / 1000000).toFixed(2)}M`
        : balance > 1000
        ? `${(balance / 1000).toFixed(2)}K`
        : balance.toString();

    message += `   💰 ${formattedBalance} (${holder.percentageOfSupplyHeld.toFixed(
      2
    )}%)\n`;

    // Only add a newline if it's not the last item
    if (i < endIdx - 1) {
      message += `\n`;
    }
  }

  return message;
}

// Add these handler functions elsewhere in your bot setup code:
