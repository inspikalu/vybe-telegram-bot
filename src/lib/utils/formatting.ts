export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function shortenAddress(address: string | null, length: number = 4): string {
  if (!address) return "N/A";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatNumber(value: number | string, decimals: number = 4): string {
  return parseFloat(value.toString()).toFixed(decimals);
}

export function formatUSD(value: number | string): string {
  return `$${parseFloat(value.toString()).toFixed(2)}`;
}

export function createSeparator(length: number = 32, char: string = "-"): string {
  return char.repeat(length);
}

export function formatMessageHeader(title: string, filters: Record<string, any>): string {
  const separator = createSeparator();
  let header = `<b>${title}</b>\n${separator}\n📊 <b>Filters:</b>\n`;

  for (const [key, value] of Object.entries(filters)) {
    const emoji = getFilterEmoji(key);
    const formattedValue = typeof value === "string" && value.length > 10 
      ? `<code>${shortenAddress(value)}</code>`
      : `<code>${value || "N/A"}</code>`;
    
    header += `${emoji} ${key}: ${formattedValue}\n`;
  }

  return header + separator;
}

function getFilterEmoji(key: string): string {
  const emojiMap: Record<string, string> = {
    "Base": "🪙",
    "Quote": "💱",
    "Resolution": "📊",
    "Token": "🪙",
    "Signature": "🔍",
    "From": "📤",
    "To": "📥",
    "Sender": "📤",
    "Receiver": "📥",
  };
  return emojiMap[key] || "📌";
} 