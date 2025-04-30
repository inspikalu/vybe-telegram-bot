import { Scenes, session, Telegraf } from "telegraf";
import { config } from "./config";

//Bot Commands
import { startCommand } from "./commands/basic/startCommand";
import { aboutCommand } from "./commands/basic/aboutCommand";
import { helpCommand } from "./commands/basic/helpCommand";
import {
  setWhaleAlertCommand,
  deleteWhaleAlertCommand,
  myAlertsCommand,
} from "./commands/basic/whaleAlertCommands";

import {
  addWalletCommand,
  removeWalletCommand,
  myWalletsCommand,
  portfolioCommand,
} from "./commands/walletTracking/portfolioCommands";
import { walletTokensCommand } from "./commands/walletTracking/walletTokensCommand";
import { walletNftsCommand } from "./commands/walletTracking/walletNftsCommand";
import { walletHistoryCommand } from "./commands/walletTracking/walletHistoryCommand";
import { topHoldersCommand } from "./commands/walletTracking/topHoldersCommand";

import { handleHoldersNextPage } from "./lib/helpers/handleHoldersNextPage";
import { handleHoldersPrevPage } from "./lib/helpers/handleHoldersPrevPage";
import { tokenDetailsCommand } from "./commands/programAnalytics/tokenDetailsCommand";
import { tokenOHLCVCommand } from "./commands/programAnalytics/tokenOHLCVCommand";
import { handleOHLCVPagination } from "./lib/helpers/handleOHLCVPagination";
import { CustomContext } from "./lib/types";
import {
  tokenTradesWizard,
  sendTokenTradesPage,
  TRADES_PER_PAGE,
} from "./scenes/tokenTradesWizard";
import { tokenTransferWizard } from "./scenes/tokenTransfersWizard";
import { setupTransferPaginationHandlers } from "./lib/helpers/tokenTransferHelper";
import { setupTokenTradesPagination } from "./lib/helpers/tokenTradesPagination";
import { tokenVolumeWizard } from "./scenes/tokenVolumeWizard";
import { setupTokenVolumePagination } from "./lib/helpers/tokenVolumePagination";
import { tokenHoldersTSCommand } from "./commands/programAnalytics/tokenHoldersTSCommand";
import { handleHoldersTSPagination } from "./lib/helpers/handleHoldersTSPagination";
import { priceWizard } from "./scenes/priceWizard";
import { setupPricePagination } from "./scenes/priceWizard";
import onboardingWizard from "./scenes/onboardingWizard";
import { connectDb, Portfolio } from "./lib/db";

// Ensure BOT_TOKEN is provided
if (!config.BOT_TOKEN) {
  console.error("⚠️ BOT_TOKEN is missing in the environment variables.");
  process.exit(1);
}

// Initialize the bot
export const bot = new Telegraf<CustomContext>(config.BOT_TOKEN);

bot.use(session());

// Scenes and stages
const stage = new Scenes.Stage<CustomContext>([
  tokenTradesWizard,
  tokenTransferWizard,
  tokenVolumeWizard,
  priceWizard,
  onboardingWizard,
]);
bot.use(stage.middleware());

// General Commands
bot.start((ctx) => ctx.scene.enter("onboarding-wizard"));
// bot.start(startCommand)
bot.help(helpCommand);
bot.command("about", aboutCommand);

// General Commands
bot.command("wallet_tokens", walletTokensCommand);
bot.command("wallet_nfts", walletNftsCommand);
bot.command("wallet_history", walletHistoryCommand);
bot.command("top_holders", topHoldersCommand);
bot.command("token", tokenDetailsCommand);
bot.command("token_ohlcv", tokenOHLCVCommand);
bot.command("token_trades", (ctx) => ctx.scene.enter("token-trades-wizard"));
bot.command("token_transfers", (ctx) =>
  ctx.scene.enter("token-transfers-wizard")
);
bot.command("token_volume", (ctx) => ctx.scene.enter("token-volume-wizard"));
bot.command("token_holder_ts", tokenHoldersTSCommand);
bot.command("price", (ctx) => ctx.scene.enter("price-wizard"));
bot.command("set_whale_alert", setWhaleAlertCommand);
bot.command("delete_whale_alert", deleteWhaleAlertCommand);
bot.command("my_alerts", myAlertsCommand);
bot.command("add_wallet", addWalletCommand);
bot.command("remove_wallet", removeWalletCommand);
bot.command("my_wallets", myWalletsCommand);
bot.command("portfolio", portfolioCommand);

// Actions
bot.action("holders_prev", handleHoldersPrevPage);
bot.action("holders_next", handleHoldersNextPage);
bot.action(/^ohlcv_page:(next|prev)$/, handleOHLCVPagination);
bot.action(/^holders_ts_page:(next|prev)$/, handleHoldersTSPagination);
bot.action("noop", (ctx) => ctx.answerCbQuery("No action available"));

// Setup pagination handlers
setupTransferPaginationHandlers(bot);
setupTokenTradesPagination(bot);
setupTokenVolumePagination(bot);
setupPricePagination(bot);

bot.action(/remove_wallet_(.+)/, async (ctx) => {
  const address = ctx.match[1];
  const userId = String(ctx.from?.id);
  await connectDb();
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio || !portfolio.wallets.includes(address)) {
    await ctx.answerCbQuery("Wallet not found.", { show_alert: true });
    return;
  }
  portfolio.wallets = portfolio.wallets.filter((w: string) => w !== address);
  await portfolio.save();
  await ctx.editMessageText(`Wallet <code>${address}</code> removed.`, {
    parse_mode: "HTML",
  });
  await ctx.answerCbQuery("Wallet removed.");
});
