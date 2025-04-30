import { Scenes, Markup } from "telegraf";
import { connectDb, Portfolio } from "../lib/db";
import { CustomContext } from "../lib/types";
import { helpCommand } from "../commands/basic/helpCommand";

const onboardingWizard = new Scenes.WizardScene<CustomContext>(
  "onboarding-wizard",
  // Step 1: Initial welcome message
  async (ctx) => {
    // At the start of each step in your wizard:
    if (
      ctx.message &&
      "text" in ctx.message &&
      ctx.message.text.trim() === "/help"
    ) {
      await ctx.scene.leave();
      await helpCommand(ctx);
      return;
    }
    await ctx.reply(
      "👋 Welcome to Vybe Bot! Let's get you started.\n\nWould you like to add your first wallet now?",
      Markup.inlineKeyboard([
        [Markup.button.callback("Yes, add wallet", "onboard_add_wallet")],
        [Markup.button.callback("Skip", "onboard_skip")],
        [Markup.button.callback("What can this bot do?", "onboard_help")],
      ])
    );
    return ctx.wizard.next();
  },

  // Step 2: Handle initial response
  async (ctx) => {
    if (
      ctx.message &&
      "text" in ctx.message &&
      ctx.message.text.trim() === "/help"
    ) {
      await ctx.scene.leave();
      await helpCommand(ctx);
      return;
    }
    if (!ctx.callbackQuery) {
      await ctx.reply("Please use the buttons above.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }
    await ctx.answerCbQuery(); // Always acknowledge callback queries

    // Type-safe callback data handling
    if ("data" in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;

      switch (data) {
        case "onboard_add_wallet":
          await ctx.reply("Please send your wallet address:");
          return ctx.wizard.next();

        case "onboard_skip":
          await ctx.reply(
            "You can add a wallet anytime with /add_wallet.\nType /help for more options."
          );
          return ctx.scene.leave();

        case "onboard_help":
          await ctx.reply(
            "This bot lets you track portfolios, set alerts, and analyze tokens. Use /help for all commands."
          );
          return ctx.wizard.selectStep(ctx.wizard.cursor - 1);

        default:
          await ctx.reply("Please use the buttons above.");
          return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
      }
    }

    await ctx.reply("Please use the buttons above.");
    return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
  },

  // Step 3: Handle wallet address input
  async (ctx) => {
    if (
      ctx.message &&
      "text" in ctx.message &&
      ctx.message.text.trim() === "/help"
    ) {
      await ctx.scene.leave();
      await helpCommand(ctx);
      return;
    }
    if (ctx.message && "text" in ctx.message) {
      const address = ctx.message.text.trim();
      const userId = String(ctx.from?.id);
      try {
        await connectDb();
        let portfolio = await Portfolio.findOne({ userId });

        if (!portfolio) {
          portfolio = new Portfolio({ userId, wallets: [] });
        }

        if (!portfolio.wallets.includes(address)) {
          portfolio.wallets.push(address);
          await portfolio.save();
        }

        await ctx.reply(`Wallet <code>${address}</code> added!`, {
          parse_mode: "HTML",
        });
        await ctx.reply(
          "You're all set! Use /portfolio to view your summary or /help for more."
        );
        return ctx.scene.leave();
      } catch (err) {
        await ctx.reply("❌ Failed to add wallet. Please try again later.");
        return ctx.scene.leave();
      }
    }

    await ctx.reply("Please send a valid wallet address.");
    return ctx.wizard.selectStep(ctx.wizard.cursor);
  }
);

export default onboardingWizard;
