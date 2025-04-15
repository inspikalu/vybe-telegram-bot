import { CustomContext } from "../../lib/types";

export async function startCommand(ctx: CustomContext) {
  await ctx.reply(
    `👋 Welcome to VybeTrackerBot!  
I'm here to provide real-time, on-chain analytics for the Solana ecosystem.  
Use /help to see available commands.`
  );
}
