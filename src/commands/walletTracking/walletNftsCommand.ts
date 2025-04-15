import { requireArgs } from "../../lib/requireArgs";
import { api } from "../../lib/api";
import { CustomContext } from "../../lib/types";

export async function walletNftsCommand(ctx: CustomContext) {
  const wallet = await requireArgs(
    ctx,
    "/wallet_nfts",
    "⚠️ Please provide a valid wallet address after the command. Example: `/wallet_nfts <your_wallet_address>`"
  );
  if (!wallet) return;

  try {
    await ctx.sendChatAction("typing");
    const processingMsg = await ctx.reply(
      "🔄 Fetching NFT data, please hold on...",
      {
        parse_mode: "HTML",
      }
    );

    const response = await api.getNftBalances(wallet);
    console.log("NFTs response:", response);

    if (!response || !response.data || response.data.length === 0) {
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        undefined,
        `😔 No NFTs found for wallet: <code>${wallet}</code>. Please ensure the address is correct and try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const formattedMessage = formatNftBalances(response);

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      undefined,
      formattedMessage,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    await ctx.reply(
      "❌ Failed to fetch NFTs. This could be due to an invalid wallet address or an issue with the API. Please try again later or check your wallet address."
    );
  }
}

function formatNftBalances(response: any): string {
  let message = `<b>🖼️ NFT Summary</b>\n\n`;
  message += `🆔 <code>${response.ownerAddress}</code>\n\n`;
  message += `💵 <b>Total Value in Sol:</b> $${response.totalSol} SOL\n`;
  message += `💵 <b>Total Value in USD:</b> $${response.totalUsd} USD\n`;

  message += `🪙 <b>NFT Collection Count: (${response.totalNftCollectionCount})</b>\n\n`;

  response.data.forEach((nft: any) => {
    message += `\n<b>🖼️ NFT Collection:</b>\n`;
    message += `- <b>Collection Address:</b> ${nft.collectionAddress}\n`;
    message += `- <b>Collection Name:</b> ${nft.name}\n`;
    message += `- <b>Price in Sol:</b> ${nft.priceSol} SOL\n`;
    message += `- <b>Price in USD:</b> $${nft.priceUsd}\n`;
    message += `- <b>Slot:</b> ${nft.slot}\n`;
    message += `- <b>Total Items:</b> ${nft.totalItems}\n`;
    message += `- <b>Value in Sol:</b> ${nft.valueSol} SOL\n`;
    message += `- <b>Value in USD:</b> $${nft.valueUsd}\n`;
  });

  message += `\nℹ️ <i>Refreshed: ${new Date(
    response.date
  ).toLocaleString()}</i>`;

  return message;
}
