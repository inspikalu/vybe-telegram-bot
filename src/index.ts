
import express from "express";
import { config } from "./config";
import { bot } from "./bot";

const app = express();
app.use(express.json());

// Webhook endpoint for Telegram updates
app.post(`/telegram/webhook`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Health check route
app.get("/", (req, res) => {
  res.send("VybeTrackerBot is running!");
});

// Start the Express server
app.listen(config.PORT, async () => {
  console.log(`🚀 Server running on port ${config.PORT}`);

  if (config.NODE_ENV === "production" && config.PUBLIC_URL) {
    try {
      const webhookUrl = `${config.PUBLIC_URL}/telegram/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Webhook set: ${webhookUrl}`);
    } catch (error) {
      console.error("❌ Error setting webhook:", error);
    }
  } else {
    bot.launch().then(() => console.log("🤖 Bot started with polling"));
    console.log("Bot is running")
  }
});

