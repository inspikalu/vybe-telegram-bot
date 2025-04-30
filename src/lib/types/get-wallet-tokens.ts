export interface WalletTokenResponse {
  activeStakedSolBalance: string;
  activeStakedSolBalanceUsd: string;
  data: Token[];
  date: number;
  ownerAddress: string;
  stakedSolBalance: string;
  stakedSolBalanceUsd: string;
  totalTokenCount: number;
  totalTokenValueUsd: string;
  totalTokenValueUsd1DChange: string;
}

export interface Token {
  amount: string;
  category: string | null;
  decimals: number;
  logplot1: string | null;
  mintAddress: string;
  name: string | null;
  priceUsed: string;
  priceUidT4Change: string;
  priceUid7BTrend: string;
  slot: number;
  symbol: string | null;
  valueUid: string;
  valueUidT4Change: string;
  verified: boolean;
}
