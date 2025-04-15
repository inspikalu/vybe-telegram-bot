import { CustomContext } from "../../lib/types";

export async function helpCommand(ctx: CustomContext) {
  await ctx.reply(
    `📌 Available Commands:
/start - Start the bot  
/help - Show this help message  
/about - Learn more about this bot  

More features coming soon! 🚀`
  );
}
