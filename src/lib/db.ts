import mongoose from "mongoose";

const whaleAlertSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Telegram user ID
  chatId: { type: String, required: true }, // Telegram chat ID
  tokenMint: { type: String, required: true },
  thresholdUsd: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const WhaleAlert = mongoose.models.WhaleAlert || mongoose.model("WhaleAlert", whaleAlertSchema);

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  console.log("Current Process Environment:", process.env.NODE_ENV);
  console.log("URI:", uri);
  if (!uri) throw new Error("MONGODB_URI not set in environment");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "vybe-bot" });
}

const portfolioSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Telegram user ID
  wallets: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

export const Portfolio = mongoose.models.Portfolio || mongoose.model("Portfolio", portfolioSchema);