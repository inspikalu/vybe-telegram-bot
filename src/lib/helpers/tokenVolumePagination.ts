import { Telegraf } from "telegraf";
import { CustomContext } from "../types";
import { api } from "../api";
import { Markup } from "telegraf";
import { sendTokenVolumePage } from "../../scenes/tokenVolumeWizard";
import { setupPaginationHandlers } from "../components/pagination";

export const setupTokenVolumePagination = (bot: Telegraf<CustomContext>) => {
  setupPaginationHandlers(bot, "token_volume", async (ctx: CustomContext, page: number) => {
    if (ctx.session.tokenVolumeData) {
      const totalPages = Math.ceil(ctx.session.tokenVolumeData.length / 5);
      if (page >= 1 && page <= totalPages) {
        ctx.session.tokenVolumePage = page - 1;
        await sendTokenVolumePage(ctx);
      }
    }
  });

  // Override the close button handler to also exit the wizard
//   bot.action("token_volume_close", async (ctx: CustomContext) => {
//     try {
//       await ctx.deleteMessage();
//       await ctx.answerCbQuery("View closed");
//       await ctx.scene.leave();
//     } catch (error) {
//       console.error("Error handling close button:", error);
//     }
//   });
}; 