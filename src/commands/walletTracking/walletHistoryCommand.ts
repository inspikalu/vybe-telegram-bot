import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { CustomContext } from "../../lib/types";

export async function walletHistoryCommand(ctx: CustomContext) {
  const wallet = await requireArgs(
    ctx,
    "/wallet_history",
    "⚠️ Please provide a valid wallet address after the command. Example: `/wallet_history <your_wallet_address>`"
  );
  if (!wallet) return;

  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      "🔄 Fetching wallet history data, please hold on...",
      {
        parse_mode: "HTML",
      }
    );

    // Default to 14 days history
    const response = await api.getTokenBalanceHistory(wallet, 14);
    console.log("Wallet history response:", response);

    if (!response || !response.data || response.data.length === 0) {
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        undefined,
        `😔 No token balance history found for wallet: <code>${wallet}</code>. Please ensure the address is correct and try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const formattedMessage = formatTokenBalanceHistory(response);

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      undefined,
      formattedMessage,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    await ctx.reply(
      "❌ Failed to fetch wallet history. This could be due to an invalid wallet address or an issue with the API. Please try again later or check your wallet address."
    );
  }
}

function formatTokenBalanceHistory(response: any): string {
  let message = `<b>📊 Token Balance History</b>\n\n`;
  message += `🆔 <code>${response.ownerAddress}</code>\n\n`;

  // Organize data by date for better readability
  const dataByDate = new Map();

  response.data.forEach((entry: any) => {
    const date = new Date(entry.blockTime * 1000).toLocaleDateString();
    if (!dataByDate.has(date)) {
      dataByDate.set(date, []);
    }
    dataByDate.get(date).push(entry);
  });

  // Format data by date
  for (const [date, entries] of dataByDate.entries()) {
    message += `<b>📅 ${date}</b>\n`;

    entries.forEach((entry: any) => {
      message += `- <b>SOL Value:</b> ${entry.stakeValue || "0"} USD\n`;
      message += `- <b>SOL Amount:</b> ${entry.stakeValueSol || "0"} SOL\n`;
      message += `- <b>System Value:</b> ${entry.systemValue || "0"} USD\n`;
      message += `- <b>Token Value:</b> ${entry.tokenValue || "0"} USD\n`;
    });

    message += `\n`;
  }

  message += `\nℹ️ <i>Data shows token balances over the last 14 days</i>`;

  return message;
}
