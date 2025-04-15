import { formatTokenOHLCVData } from "../../commands/programAnalytics/tokenOHLCVCommand";
import { CustomContext } from "../types";

export async function handleOHLCVPagination(ctx: CustomContext) {
  const callbackQuery = ctx.callbackQuery;

  // Ensure callbackQuery is of type DataQuery
  if (!callbackQuery || !("data" in callbackQuery)) return;

  const callbackData = callbackQuery.data;

  const [action, direction] = callbackData.split(":");
  if (action !== "ohlcv_page") return;

  // Get current page and data from session
  const session = ctx.session || {};
  const currentPage = session.ohlcvPage || 0;
  const data = session.ohlcvData || [];
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
    ohlcvPage: newPage,
  };

  const { message, keyboard } = formatTokenOHLCVData(
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
