import dotenv from "dotenv";

dotenv.config();

console.log("🚀 Config loaded.");
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN as string,
  API_BASE_URL: process.env.API_BASE_URL || "https://api.vybenetwork.xyz",
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development", // Defaults to "development"
  PUBLIC_URL: process.env.PUBLIC_URL || "", // Needed for webhook mode
  VYBE_API_KEY: process.env.VYBE_API_KEY || "",
};
