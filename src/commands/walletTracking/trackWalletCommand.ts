import { Context } from "telegraf";
import { api } from "../../lib/api";
// import { getTokenBalances, getWalletTransfers } from "../../lib/api";
import { CustomContext } from "../../lib/types";
import { requireArgs } from "../../lib/requireArgs";

export async function trackWalletCommand(ctx: CustomContext) {
  const walletAddress = requireArgs(
    ctx,
    "/track_wallet",
    "❌ Please provide a wallet address. Usage: `/trackWallet <wallet_address>`"
  );
  if (!walletAddress || walletAddress === null) return;

  ctx.reply(`🔍 Tracking wallet: \`${walletAddress}\`...\nPlease wait...`, {
    parse_mode: "Markdown",
  });

  const [balances, transfers] = await Promise.all([
    api.getTokenBalances(walletAddress),
    api.getWalletTransfers(walletAddress),
  ]);

  let message = `📊 **Wallet Analytics** (\`${walletAddress}\`)\n\n`;

  // Token Balances
  if (balances && balances.length > 0) {
    message += `💰 **Token Holdings:**\n`;
    balances.forEach(
      (token: { tokenSymbol: string; balance: number }, index: number) => {
        if (index < 5) {
          message += `🔹 ${token.tokenSymbol || "Unknown"}: ${token.balance}\n`;
        }
      }
    );
  } else {
    message += `💰 **No token balances found.**\n`;
  }

  // Recent Transfers
  if (transfers && transfers.length > 0) {
    message += `\n🔄 **Recent Transactions:**\n`;
    transfers.forEach((tx, index) => {
      if (index < 3) {
        message += `🔸 ${tx.mintAddress}: ${tx.amount} ${
          tx.tokenSymbol || ""
        }\n`;
      }
    });
  } else {
    message += `\n🔄 **No recent transactions found.**\n`;
  }

  ctx.reply(message, { parse_mode: "Markdown" });
}
