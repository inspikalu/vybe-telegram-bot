import { CustomContext } from "../../lib/types";

export async function helpCommand(ctx: CustomContext) {
  await ctx.reply(
    `🤖 Vybe Telegram Bot Help

📌 Basic Commands:
/start - Start the bot and get welcome message
/help - Show this help message
/about - Learn more about this bot

💼 Wallet Tracking:
/wallet_tokens - View tokens in a wallet
/wallet_nfts - View NFTs in a wallet
/wallet_history - View wallet transaction history
/top_holders - View top holders of a token

📊 Token Analytics:
/token - Get detailed information about a token
/token_ohlcv - View OHLCV (Open, High, Low, Close, Volume) data
/token_trades - View token trades (interactive wizard)
/token_transfers - View token transfers (interactive wizard)
/token_volume - View token volume data (interactive wizard)
/token_holder_ts - View token holder time series data
/price - View price information (interactive wizard)

`
  );
}
