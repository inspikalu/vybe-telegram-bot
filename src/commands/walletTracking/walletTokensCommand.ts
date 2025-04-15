import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { CustomContext } from "../../lib/types";

export async function walletTokensCommand(ctx: CustomContext) {
  const args = await requireArgs(
    ctx,
    "/wallet_tokens",
    "Please provide a wallet address after the command."
  );

  if (!args) return;

  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      `🔍 Fetching token balances for wallet:\n<code>${args}</code>`,
      {
        parse_mode: "HTML",
      }
    );

    const response = await api.getTokenBalances(args);

    const formattedMessage = formatTokenBalances(response);

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      undefined,
      formattedMessage,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error fetching token balances:", error);
    await ctx.reply(
      "❌ Failed to fetch token balances. Please try again later."
    );
  }
}

function formatTokenBalances(response: any): string {
  // Format USD values
  const totalValue = parseFloat(response.totalTokenValueUsd).toFixed(2);
  const dailyChange = (
    parseFloat(response.totalTokenValueUsd1dChange) * 100
  ).toFixed(2);
  const changeEmoji = response.totalTokenValueUsd1dChange >= 0 ? "📈" : "📉";

  // Create message header
  let message = `💰 <b>Wallet Summary</b> 💰\n\n`;
  message += `🆔 <code>${response.ownerAddress}</code>\n\n`;
  message += `💵 <b>Total Value:</b> $${totalValue} USD\n`;
  message += `${changeEmoji} <b>24h Change:</b> ${dailyChange}%\n\n`;

  // Add staking info if available
  if (parseFloat(response.stakedSolBalance) > 0) {
    message += `🔒 <b>Staked SOL:</b> ${response.stakedSolBalance} ($${response.stakedSolBalanceUsd})\n\n`;
  }

  // Token list header
  message += `🪙 <b>Tokens (${response.data.length})</b>:\n`;

  // Format each token
  response.data.forEach((token: any, index: number) => {
    const amount = parseFloat(token.amount).toFixed(
      token.decimals > 4 ? 4 : token.decimals
    );
    const value = parseFloat(token.valueUsd).toFixed(2);
    const dailyChange = (parseFloat(token.priceUsd1dChange) * 100).toFixed(2);

    message += `\n${index + 1}. <b>${token.symbol}</b>\n`;
    message += `┣ Amount: ${amount}\n`;
    message += `┣ Value: $${value} USD\n`;
    message += `┗ 24h: ${dailyChange}%\n`;
  });

  // Add footer
  message += `\nℹ️ <i>Refreshed: ${new Date(
    response.date
  ).toLocaleString()}</i>`;

  return message;
}
