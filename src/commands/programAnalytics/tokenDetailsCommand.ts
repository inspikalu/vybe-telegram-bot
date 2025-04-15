import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { CustomContext } from "../../lib/types";

export async function tokenDetailsCommand(ctx: CustomContext) {
  const mintAddress = await requireArgs(
    ctx,
    "/token",
    "⚠️ Please provide a valid token mint address after the command. Example: `/token <mint_address>`"
  );
  if (!mintAddress) return;

  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      "🔄 Fetching token details, please hold on...",
      {
        parse_mode: "HTML",
      }
    );

    const response = await api.getTokenDetails(mintAddress);
    console.log("Token details response:", response);

    if (!response) {
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        undefined,
        `😔 No details found for token with mint address: <code>${mintAddress}</code>. Please ensure the address is correct and try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const formattedMessage = formatTokenDetails(response);

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      undefined,
      formattedMessage,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error fetching token details:", error);
    await ctx.reply(
      "❌ Failed to fetch token details. This could be due to an invalid mint address or an issue with the API. Please try again later or check your mint address."
    );
  }
}

function formatTokenDetails(token: any): string {
  const priceChange1d = calculatePriceChange(token.price, token.price1d);
  const priceChange7d = calculatePriceChange(token.price, token.price7d);

  let message = `<b>🪙 Token Details</b>\n\n`;

  // Token basic info
  message += `<b>${token.name || "Unknown"} (${token.symbol})</b>\n`;
  message += `🆔 <code>${token.mintAddress}</code>\n`;
  if (token.verified) {
    message += `✅ <b>Verified</b>\n`;
  }

  message += `\n<b>📊 Market Data</b>\n`;
  message += `💰 <b>Price:</b> $${formatNumber(token.price)}\n`;
  message += `📈 <b>24h Change:</b> ${formatPercentage(priceChange1d)}\n`;
  message += `📈 <b>7d Change:</b> ${formatPercentage(priceChange7d)}\n`;
  message += `💎 <b>Market Cap:</b> $${formatNumber(token.marketCap)}\n`;

  // Supply & Decimal info
  message += `\n<b>📋 Token Info</b>\n`;
  message += `🔢 <b>Decimals:</b> ${token.decimal}\n`;
  message += `📊 <b>Supply:</b> ${formatNumber(token.currentSupply)}\n`;

  // 24h Activity
  message += `\n<b>🔄 24h Activity</b>\n`;
  if (token.tokenAmountVolume24h !== null) {
    message += `📊 <b>Volume (Tokens):</b> ${formatNumber(
      token.tokenAmountVolume24h
    )}\n`;
  }
  if (token.usdValueVolume24h !== null) {
    message += `💵 <b>Volume (USD):</b> $${formatNumber(
      token.usdValueVolume24h
    )}\n`;
  }

  // Additional metadata if available
  if (token.category || token.subcategory) {
    message += `\n<b>🏷️ Classification</b>\n`;
    if (token.category) {
      message += `📁 <b>Category:</b> ${token.category}\n`;
    }
    if (token.subcategory) {
      message += `📂 <b>Subcategory:</b> ${token.subcategory}\n`;
    }
  }

  // Last update time
  const updateDate = new Date(token.updateTime).toLocaleString();
  message += `\n⏱️ <i>Last updated: ${updateDate}</i>`;

  return message;
}

function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): number {
  if (!previousPrice) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

function formatNumber(num: number | null): string {
  if (num === null) return "N/A";

  // For very large numbers, use abbreviations
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }

  // For small decimals like token prices
  if (num < 0.001 && num > 0) {
    return num.toExponential(4);
  }

  // For regular numbers
  return num.toLocaleString(undefined, {
    maximumFractionDigits: 6,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  });
}

function formatPercentage(num: number): string {
  const sign = num >= 0 ? "🟢 +" : "🔴 ";
  return `${sign}${Math.abs(num).toFixed(2)}%`;
}
