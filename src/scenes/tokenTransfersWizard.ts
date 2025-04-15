import { api } from "../lib/api";
import { showTokenTransfers } from "../lib/helpers/tokenTransferHelper";
import { CustomContext } from "../lib/types";
import { Scenes } from "telegraf";
import { TokenTransfer } from "../lib/types/api";

export const tokenTransferWizard = new Scenes.WizardScene<CustomContext>(
  "token-transfers-wizard",
  // Step 1: Collect Mint Address
  async (ctx) => {
    await ctx.replyWithMarkdownV2(
      "Enter the **Mint address** \\(or type 'skip'\\):"
    );
    return ctx.wizard.next();
  },

  // Step 2: Collect Signature
  async (ctx: CustomContext) => {
    if (ctx.message && "text" in ctx.message) {
      const text = ctx.message.text.trim();
      if (text) {
        ctx.session.tokenTransferFilters =
          ctx.session.tokenTransferFilters || {};

        if (text.toLowerCase() !== "skip") {
          ctx.session.tokenTransferFilters.mintAddress = text;
        }
        await ctx.replyWithMarkdownV2(
          "Enter the **Signature of the transaction** \\(or type 'skip'\\): "
        );
      } else {
        await ctx.reply(
          "❌ Input cannot be empty. Please enter a valid address or type 'skip'."
        );
        return ctx.wizard.selectStep(ctx.wizard.cursor);
      }
    } else {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    return ctx.wizard.next();
  },

  // Step 3: Collect Sender Address
  async (ctx: CustomContext) => {
    if (ctx.message && "text" in ctx.message) {
      const text = ctx.message.text.trim();
      if (text) {
        ctx.session.tokenTransferFilters =
          ctx.session.tokenTransferFilters || {};

        if (text.toLowerCase() !== "skip") {
          ctx.session.tokenTransferFilters.signature = text;
        }
        await ctx.replyWithMarkdownV2(
          "Enter the **Sender address** \\(or type 'skip'\\): "
        );
      } else {
        await ctx.reply(
          "❌ Input cannot be empty. Please enter a valid signature or type 'skip'."
        );
        return ctx.wizard.selectStep(ctx.wizard.cursor);
      }
    } else {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    return ctx.wizard.next();
  },

  // Step 4: Collect Receiver Address
  async (ctx: CustomContext) => {
    if (ctx.message && "text" in ctx.message) {
      const text = ctx.message.text.trim();
      if (text) {
        ctx.session.tokenTransferFilters =
          ctx.session.tokenTransferFilters || {};

        if (text.toLowerCase() !== "skip") {
          ctx.session.tokenTransferFilters.senderAddress = text;
        }
        await ctx.replyWithMarkdownV2(
          "Enter the **Receiver address** \\(or type 'skip'\\): "
        );
      } else {
        await ctx.reply(
          "❌ Input cannot be empty. Please enter a valid sender address or type 'skip'."
        );
        return ctx.wizard.selectStep(ctx.wizard.cursor);
      }
    } else {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    return ctx.wizard.next();
  },

  // Step 5: Finalize and Display Summary
  async (ctx: CustomContext) => {
    if (ctx.message && "text" in ctx.message) {
      const text = ctx.message.text.trim();
      if (text) {
        ctx.session.tokenTransferFilters =
          ctx.session.tokenTransferFilters || {};

        if (text.toLowerCase() !== "skip") {
          ctx.session.tokenTransferFilters.recieverAddress = text;
        }

        // Create a summary of the collected information
        const filters = ctx.session.tokenTransferFilters;
        let summaryText = "**Token Transfer Filters Summary:** \n\n";

        summaryText += `**Mint Address:** ${
          filters.mintAddress
            ? filters.mintAddress.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1")
            : "Not specified"
        }\n`;
        summaryText += `**Transaction Signature:** ${
          filters.signature
            ? filters.signature.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1")
            : "Not specified"
        }\n`;
        summaryText += `**Sender Address:** ${
          filters.senderAddress
            ? filters.senderAddress.replace(
                /([_*[\]()~`>#+\-=|{}.!\\])/g,
                "\\$1"
              )
            : "Not specified"
        }\n`;
        summaryText += `**Receiver Address:** ${
          filters.recieverAddress
            ? filters.recieverAddress.replace(
                /([_*[\]()~`>#+\-=|{}.!\\])/g,
                "\\$1"
              )
            : "Not specified"
        }\n\n`;
        summaryText +=
          "Would you like to proceed with these filters\\? Type *yes* to confirm or *no* to cancel\\.";

        await ctx.replyWithMarkdownV2(summaryText);
      } else {
        await ctx.reply(
          "❌ Input cannot be empty. Please enter a valid receiver address or type 'skip'."
        );
        return ctx.wizard.selectStep(ctx.wizard.cursor);
      }
    } else {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    return ctx.wizard.next();
  },

  // Step 6: Handle confirmation
  async (ctx: CustomContext) => {
    if (ctx.message && "text" in ctx.message) {
      const text = ctx.message.text.trim().toLowerCase();

      if (text === "yes") {
        // Process the filters
        await ctx.reply("Processing your token transfer filters...");

        const response = await api.getTokenTransfers(
          ctx.session.tokenTransferFilters || {}
        );
        console.log(
          "Token Transfer wizard response: ",
          response
          //   response.data.length
        );
        const responseWithTransfer = response as unknown as {
          transfers: TokenTransfer[];
        };
        console.log(typeof responseWithTransfer);
        await showTokenTransfers(ctx, responseWithTransfer.transfers);
        await ctx.reply("Filter processing complete!");
      } else if (text === "no") {
        await ctx.reply("Token transfer filter operation cancelled.");
        ctx.session.tokenTransferFilters = {}; // Clear the filters
      } else {
        await ctx.reply("Please type 'yes' to confirm or 'no' to cancel.");
        return ctx.wizard.selectStep(ctx.wizard.cursor);
      }
    } else {
      await ctx.reply("Please send a text message.");
      return ctx.wizard.selectStep(ctx.wizard.cursor);
    }

    // Exit the wizard
    return ctx.scene.leave();
  }
);
