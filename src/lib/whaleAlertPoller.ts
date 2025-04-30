import { api } from "./api";
import { connectDb, WhaleAlert } from "./db";
import { bot } from "../bot";

// In-memory cache to avoid duplicate alerts
const lastAlertedTx: Record<string, string> = {};

export async function startWhaleAlertPoller() {
  await connectDb();
  setInterval(async () => {
    const alerts = await WhaleAlert.find({});
    for (const alert of alerts) {
      try {
        // Fetch recent transfers for the token
        const res = await api.getTokenTransfers({ mintAddress: alert.tokenMint, limit: 10, sortByDesc: "blockTime" });
        const transfers = res?.data?.transfers || res?.data || [];
        for (const transfer of transfers) {
          if (parseFloat(transfer.valueUsd) >= alert.thresholdUsd) {
            // Only alert if this transfer hasn't been alerted for this user
            const cacheKey = `${alert.userId}:${alert.tokenMint}`;
            if (lastAlertedTx[cacheKey] === transfer.signature) continue;
            lastAlertedTx[cacheKey] = transfer.signature;
            // Send Telegram alert
            await bot.telegram.sendMessage(
              alert.chatId,
              `🐋 <b>Whale Alert!</b>\nToken: <code>${alert.tokenMint}</code>\nAmount: $${parseFloat(transfer.valueUsd).toLocaleString()}\nTx: <code>${transfer.signature}</code>`,
              { parse_mode: "HTML" }
            );
          }
        }
      } catch (e) {
        // Ignore errors for individual alerts
      }
    }
  }, 60 * 1000); // Poll every 60 seconds
}