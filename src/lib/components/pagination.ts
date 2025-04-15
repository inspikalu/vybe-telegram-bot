import { Markup } from "telegraf";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

export interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  callbackPrefix: string;
  showFirstLast?: boolean;
  showClose?: boolean;
}

export function createPaginationKeyboard({
  currentPage,
  totalPages,
  callbackPrefix,
  showFirstLast = true,
  showClose = true,
}: PaginationOptions): InlineKeyboardButton[][] {
  const keyboard: InlineKeyboardButton[][] = [];
  const navRow: InlineKeyboardButton[] = [];

  // First page button
  if (showFirstLast && currentPage > 1) {
    navRow.push({
      text: "⏮ First",
      callback_data: `${callbackPrefix}_page_1`,
    });
  }

  // Previous page button
  if (currentPage > 1) {
    navRow.push({
      text: "◀️ Prev",
      callback_data: `${callbackPrefix}_page_${currentPage - 1}`,
    });
  }

  // Current page indicator
  navRow.push({
    text: `${currentPage}/${totalPages}`,
    callback_data: "ignore",
  });

  // Next page button
  if (currentPage < totalPages) {
    navRow.push({
      text: "Next ▶️",
      callback_data: `${callbackPrefix}_page_${currentPage + 1}`,
    });
  }

  // Last page button
  if (showFirstLast && currentPage < totalPages) {
    navRow.push({
      text: "Last ⏭",
      callback_data: `${callbackPrefix}_page_${totalPages}`,
    });
  }

  keyboard.push(navRow);

  // Add a "Close" button if requested
  if (showClose) {
    keyboard.push([
      {
        text: "❌ Close",
        callback_data: `${callbackPrefix}_close`,
      },
    ]);
  }

  return keyboard;
}

export function setupPaginationHandlers(
    bot: any,
    callbackPrefix: string,
    pageHandler: (ctx: any, page: number) => Promise<void>
  ) {
    // Page navigation handler
    bot.action(new RegExp(`${callbackPrefix}_page_(\\d+)`), async (ctx: any) => {
      const page = parseInt((ctx.match as RegExpMatchArray)[1]);
      await pageHandler(ctx, page);
      await ctx.answerCbQuery();
    });
  
    // Close button handler
    bot.action(`${callbackPrefix}_close`, async (ctx: any) => {
      try {
        await ctx.deleteMessage();
        
        // If we're in a wizard scene, leave it
        if (ctx.scene && ctx.scene.current) {
          await ctx.scene.leave();
        }
      } catch (error) {
        console.error("Error handling close:", error);
        // If deletion fails, try to edit the message
        try {
          await ctx.editMessageText("Closed.");
        } catch (editError) {
          console.error("Error editing message:", editError);
        }
      }
      await ctx.answerCbQuery("View closed");
    });
  }
