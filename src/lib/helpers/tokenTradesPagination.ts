import { CustomContext } from "../types";
import { sendTokenTradesPage } from "../../scenes/tokenTradesWizard";
import { setupPaginationHandlers } from "../components/pagination";

export function setupTokenTradesPagination(bot: any) {
  setupPaginationHandlers(bot, "token_trades", async (ctx: CustomContext, page: number) => {
    if (ctx.session.tokenTradesData) {
      const totalPages = Math.ceil(ctx.session.tokenTradesData.length / 5); 
      if (page >= 1 && page <= totalPages) {
        ctx.session.tokenTradesPage = page - 1;
        await sendTokenTradesPage(ctx);
      }
    }
  });
} 