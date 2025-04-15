import { Scenes } from "telegraf";
import { CustomContext } from "../types";

export abstract class BaseWizardScene extends Scenes.WizardScene<CustomContext> {
  protected constructor(
    sceneId: string,
    steps: ((ctx: CustomContext) => Promise<Scenes.WizardContextWizard<CustomContext>>)[]
  ) {
    super(sceneId, ...steps);
  }

  protected async validateInput(
    ctx: CustomContext,
    input: string,
    validator: (input: string) => boolean,
    errorMessage: string
  ): Promise<boolean> {
    if (input.toLowerCase() === "skip") return true;
    
    if (!validator(input)) {
      await ctx.reply(errorMessage);
      return false;
    }
    return true;
  }

  protected async handleSkipOrInput(
    ctx: CustomContext,
    input: string,
    fieldName: string,
    validator: (input: string) => boolean,
    errorMessage: string
  ): Promise<boolean> {
    if (!input) {
      await ctx.reply(`❌ Input cannot be empty. Please enter a valid ${fieldName} or type 'skip'.`);
      return false;
    }

    if (input.toLowerCase() === "skip") return true;

    if (!validator(input)) {
      await ctx.reply(errorMessage);
      return false;
    }

    return true;
  }

  protected async showFilterSummary(
    ctx: CustomContext,
    title: string,
    filters: Record<string, any>
  ): Promise<void> {
    const { formatMessageHeader } = await import("../utils/formatting");
    await ctx.replyWithHTML(`✅ Got it. Here's your filter summary:\n\n${formatMessageHeader(title, filters)}\n\nNow fetching the data...`);
  }
} 