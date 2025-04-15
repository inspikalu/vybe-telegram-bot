// Function to format token transfers for display in Telegram
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { CustomContext } from "../types";
import { TokenTransfer } from "../types/api";

// Define the Transfer interface based on your schema

type ParseMode = "HTML";

function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

// Format a single transfer for display
function formatTransfer(transfer: TokenTransfer): string {
  const date = new Date(transfer.blockTime * 1000).toLocaleString();
  const shortenAddress = (address: string | null) =>
    address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "N/A";

  // Escape the date string
  const escapedDate = escapeMarkdownV2(date);

  return `\
🔄 <b>Transfer</b>
📝 Signature: <code>${escapeMarkdownV2(shortenAddress(transfer.signature))}</code>
⏱ Time: ${escapedDate}
💰 Amount: ${escapeMarkdownV2(transfer.calculatedAmount.toString())}
💵 Value: $${escapeMarkdownV2(parseFloat(transfer.valueUsd).toFixed(2))}
📤 From: <code>${escapeMarkdownV2(shortenAddress(transfer.senderAddress))}</code>
📥 To: <code>${escapeMarkdownV2(shortenAddress(transfer.receiverAddress))}</code>
🪙 Token: <code>${escapeMarkdownV2(shortenAddress(transfer.mintAddress))}</code>`;
}

// Create pagination controls
function createPaginationKeyboard(
  currentPage: number,
  totalPages: number,
  cbPrefix: string
): InlineKeyboardButton[][] {
  const keyboard: InlineKeyboardButton[][] = [];

  // Navigation row
  const navRow: InlineKeyboardButton[] = [];

  // First page button
  if (currentPage > 1) {
    navRow.push({
      text: "⏮ First",
      callback_data: `${cbPrefix}_page_1`,
    });
  }

  // Previous page button
  if (currentPage > 1) {
    navRow.push({
      text: "◀️ Prev",
      callback_data: `${cbPrefix}_page_${currentPage - 1}`,
    });
  }

  // Current page indicator
  navRow.push({
    text: `${currentPage}/${totalPages}`,
    callback_data: "ignore", // This button doesn't do anything when pressed
  });

  // Next page button
  if (currentPage < totalPages) {
    navRow.push({
      text: "Next ▶️",
      callback_data: `${cbPrefix}_page_${currentPage + 1}`,
    });
  }

  // Last page button
  if (currentPage < totalPages) {
    navRow.push({
      text: "Last ⏭",
      callback_data: `${cbPrefix}_page_${totalPages}`,
    });
  }

  keyboard.push(navRow);

  // Add a "Close" button
  keyboard.push([
    {
      text: "❌ Close",
      callback_data: `${cbPrefix}_close`,
    },
  ]);

  return keyboard;
}

// Display transfers with pagination
export async function displayTransfers(
  ctx: CustomContext,
  transfers: TokenTransfer[],
  page: number = 1,
  itemsPerPage: number = 5
): Promise<void> {
  console.log("Array Length: ", transfers.length);
  // Calculate pagination values
  const totalItems = transfers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // Get items for the current page
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
  const pageItems = transfers.slice(startIdx, endIdx);

  // Create message header
  const separator = "--------------------------------";
  const filterInfo = (ctx.session as any).tokenTransferFilters || {};
  const mintAddress = filterInfo.mintAddress
    ? `<code>${filterInfo.mintAddress}</code>`
    : "Any";
  const signature = filterInfo.signature || "Any";
  const senderAddress = filterInfo.senderAddress
    ? `<code>${filterInfo.senderAddress}</code>`
    : "Any";
  const receiverAddress = filterInfo.recieverAddress
    ? `<code>${filterInfo.recieverAddress}</code>`
    : "Any";

  let header = `
<b>Token Transfers</b>
${separator}
📊 <b>Filters:</b>
🪙 Token: ${mintAddress}
🔍 Signature: ${signature}
📤 From: ${senderAddress}
📥 To: ${receiverAddress}
${separator}
`;

  // Create the transfers display
  if (pageItems.length === 0) {
    await ctx.reply("No transfers found matching your criteria.");
    return;
  }

  // Format each transfer
  const transfersText = pageItems
  .map(formatTransfer)
  .join(`\n\n${separator}\n\n`);

  // Create the footer with pagination info
  const footer = `\n${separator}\n📄 Showing ${
    startIdx + 1
  }-${endIdx} of ${totalItems} transfers`;

  // Combine everything
  const message = `${header}\n${transfersText}\n${footer}`;

  // Create pagination keyboard
  const keyboard = createPaginationKeyboard(
    currentPage,
    totalPages,
    "transfers"
  );

  // Send or edit message based on context
  const msgOptions = {
    parse_mode: "HTML" as ParseMode,
    reply_markup: {
      inline_keyboard: keyboard,
    },
    disable_web_page_preview: true,
  };

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(message, msgOptions);
    } catch (error) {
      console.error("Error updating message:", error);
      // If edit fails (e.g., message is unchanged), acknowledge the callback
      await ctx.answerCbQuery();
    }
  } else {
    await ctx.reply(message, msgOptions);
  }
}

// Handler for pagination callbacks
export function setupTransferPaginationHandlers(bot: any) {
  bot.action(/transfers_page_(\d+)/, async (ctx: CustomContext) => {
    const page = parseInt((ctx.match as RegExpMatchArray)[1]);
    const transfers = (ctx.session as any).tokenTransfersData || [];

    await displayTransfers(ctx, transfers, page);
    await ctx.answerCbQuery();
  });

  // Close button handler
  bot.action("transfers_close", async (ctx: CustomContext) => {
    await ctx.deleteMessage();
    await ctx.answerCbQuery("Transfer view closed");
  });
}

// Main function to be called from your scene or command handler
export async function showTokenTransfers(
  ctx: CustomContext,
  transfers: TokenTransfer[]
) {
  // Store the transfers data in session for pagination
  (ctx.session as any).tokenTransfersData = transfers;
  (ctx.session as any).tokenTransfersPage = 1;

  // Display the first page
  await displayTransfers(ctx, transfers, 1);
}
