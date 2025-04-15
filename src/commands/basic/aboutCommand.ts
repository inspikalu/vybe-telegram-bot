import { CustomContext } from "../../lib/types";

export async function aboutCommand(ctx: CustomContext) {
  await ctx.reply(
    `ℹ️ **VybeTrackerBot**  
Built to provide actionable, real-time insights using Vybe APIs.  
🔗 Powered by Solana & Vybe Analytics.  

Developed for the Vybe Telegram Bot Challenge. 🚀`,
    { parse_mode: "Markdown" }
  );
}
