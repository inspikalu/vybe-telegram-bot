import { holdersPaginationStore as paginationStore } from "../state";
import { api } from "../api";
import { formatTopHoldersPage } from "../../commands/walletTracking/topHoldersCommand";
import { Markup } from "telegraf";

export async function handleHoldersNextPage(ctx: any) {
  console.log("Clicked the next button");
  const chatId = ctx.chat.id;
  const paginationData = paginationStore.get(chatId);

  if (!paginationData) {
    await ctx.answerCbQuery(
      "No active holder data found. Please run the command again."
    );
    return;
  }

  const maxPages = Math.ceil(paginationData.totalCount / 10);
  if (paginationData.currentPage >= maxPages) {
    await ctx.answerCbQuery("You are already on the last page.");
    return;
  }

  paginationData.currentPage++;
  paginationStore.set(chatId, paginationData);

  // Refetch the data
  try {
    const response = await api.getTokenTopHolders(paginationData.tokenAddress);
    const formattedMessage = formatTopHoldersPage(
      response,
      paginationData.currentPage
    );

    await ctx.editMessageText(formattedMessage, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        Markup.button.callback("⬅️ Previous", "holders_prev"),
        Markup.button.callback("Next ➡️", "holders_next"),
      ]),
    });
  } catch (error) {
    console.error("Error updating holders page:", error);
    await ctx.answerCbQuery("Failed to update. Please try again.");
  }
}
