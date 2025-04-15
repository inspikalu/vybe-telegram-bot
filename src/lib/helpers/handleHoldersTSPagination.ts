import { formatTokenHoldersTSData } from "../../commands/programAnalytics/tokenHoldersTSCommand";
import { CustomContext } from "../types";

export async function handleHoldersTSPagination(ctx: CustomContext) {
  const callbackQuery = ctx.callbackQuery;

  // Ensure callbackQuery is of type DataQuery
  if (!callbackQuery || !("data" in callbackQuery)) return;

  const callbackData = callbackQuery.data;

  const [action, direction] = callbackData.split(":");
  if (action !== "holders_ts_page") return;

  // Get current page and data from session
  const session = ctx.session || {};
  const currentPage = session.holdersTSPage || 0;
  const data = session.holdersTSData || [];
  const tokenAddress = session.tokenAddress || "unknown";

  let newPage = currentPage;

  if (direction === "next") {
    newPage = Math.min(Math.ceil(data.length / 5) - 1, currentPage + 1);
  } else if (direction === "prev") {
    newPage = Math.max(0, currentPage - 1);
  }

  // Update session
  ctx.session = {
    ...session,
    holdersTSPage: newPage,
  };

  const { message, keyboard } = formatTokenHoldersTSData(
    data,
    tokenAddress,
    newPage
  );

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    ...keyboard,
  });

  await ctx.answerCbQuery();
} 