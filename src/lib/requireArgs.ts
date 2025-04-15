import { CustomContext } from "./types";

/**
 * Checks if a command has arguments and returns a message if missing
 * @param ctx - Telegraf context
 * @param command - The command to check (e.g., '/wallet_tokens')
 * @param missingMessage - Message to return if arguments are missing
 * @returns The trimmed arguments string if present, otherwise sends message and returns null
 */
export async function requireArgs(
    ctx: CustomContext,
    command: string,
    missingMessage: string
): Promise<string | null> {
    // Check if message exists and has text
    if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(missingMessage);
        return null;
    }

    // Extract arguments
    const args = ctx.message.text.substring(command.length).trim();

    // Check if arguments exist
    if (!args) {
        await ctx.reply(missingMessage);
        return null;
    }

    return args;
}