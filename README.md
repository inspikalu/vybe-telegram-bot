# Vybe Telegram Bot

A Telegram bot for monitoring Solana wallets and tokens, built with Node.js, TypeScript, and the Telegraf framework.

## Features

- Real-time monitoring of Solana wallets
- Token tracking and notifications
- Interactive Telegram interface (wizards for trades, transfers, volume, price)
- Whale alert notifications
- Secure API integration with Vybe Network
- Portfolio and wallet analytics

## Architecture

```
├── src/
│   ├── bot.ts              # Main bot configuration and setup
│   ├── index.ts            # Application entry point (Express server & webhook)
│   ├── commands/           # Bot command handlers (basic, walletTracking, programAnalytics)
│   ├── config/             # Configuration loader
│   ├── lib/                # Helpers, API, DB, state, components, types, utils
│   ├── routes/             # (Minimal) API route definitions
│   └── scenes/             # Telegram wizard scenes for interactive flows
├── .env.example            # Environment variables template
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── nodemon.json            # Development server configuration
```

## Prerequisites

- Node.js (v16 or higher)
- pnpm (Package Manager)
- Telegram Bot Token (from BotFather)
- Vybe Network API Key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vybe-telegram-bot
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
- `BOT_TOKEN`: Your Telegram bot token
- `VYBE_API_KEY`: Your Vybe Network API key
- `PORT`: Server port (default: 5000)
- `API_BASE_URL`: Vybe Network API base URL

## Running the Bot

### Development Mode
```bash
pnpm dev
```

### Production Mode
```bash
pnpm build
pnpm start
```

## Available Commands

### Basic Commands
- `/start` - Start the bot and get welcome message
- `/help` - Display help information
- `/about` - Get information about the bot

### Wallet Tracking Commands
- `/wallet_tokens` - View tokens in a wallet
- `/wallet_nfts` - View NFTs in a wallet
- `/wallet_history` - View wallet transaction history
- `/top_holders` - View top holders of a token
- `/portfolio` - View your tracked wallets' portfolio
- `/add_wallet` - Add a wallet to track
- `/remove_wallet` - Remove a tracked wallet
- `/my_wallets` - List your tracked wallets

### Whale Alerts
- `/set_whale_alert` - Set a whale alert
- `/delete_whale_alert` - Delete a whale alert
- `/my_alerts` - List your whale alerts

### Token Analytics Commands
- `/token` - Get detailed information about a token
- `/token_ohlcv` - View OHLCV (Open, High, Low, Close, Volume) data for a token
- `/token_trades` - View token trades (interactive wizard)
- `/token_transfers` - View token transfers (interactive wizard)
- `/token_volume` - View token volume data (interactive wizard)
- `/token_holder_ts` - View token holder time series data
- `/price` - View price information (interactive wizard)

## Environment Variables

| Variable             | Description                                      | Required |
|----------------------|--------------------------------------------------|----------|
| `BOT_TOKEN`          | Telegram Bot Token                               | Yes      |
| `VYBE_API_KEY`       | Vybe Network API Key                             | Yes      |
| `PORT`               | Server Port                                      | No       |
| `API_BASE_URL`       | Vybe Network API Base URL                        | No       |
| `PUBLIC_URL`         | Public URL for webhook (prod only)               | No       |
| `ALPHAVYBE_API_KEY`  | (Optional) AlphaVybe API Key for extra features  | No       |
| `MONGODB_URI`        | MongoDB connection string                        | Yes      |
| `MONGODB_DB`         | MongoDB database name                            | Yes      |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.