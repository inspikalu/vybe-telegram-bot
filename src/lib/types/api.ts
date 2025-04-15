export interface TokenBalance {
  token: string;
  balance: number;
  decimals: number;
}

export interface WalletTransfer {
  txHash: string;
  from: string;
  to: string;
  amount: number;
  tokenSymbol: string;
  timeStart: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface TokenTradesParams {
  programId?: string;
  baseMintAddress?: string;
  quoteMintAddress?: string;
  mintAddress?: string;
  marketId?: string;
  authorityAddress?: string;
  resolution?: string;
  timeStart?: number;
  timeEnd?: number;
  page?: number;
  limit?: number;
  sortByAsc?: "price" | "blocktime";
  sortByDesc?: "price" | "blocktime";
  feePayer?: string;
}
export interface TokenTransferParams {
  mintAddress?: string;
  signature?: string;
  senderAddress?: string;
  recieverAddress?: string;
}

export interface TokenTrade {
  authorityAddress: string;
  baseMintAddress: string;
  baseSize: string;
  blockTime: number;
  fee: string;
  feePayer: string;
  iixOrdinal: number;
  interIxOrdinal: number;
  ixOrdinal: number;
  marketId: string;
  price: string;
  programId: string;
  quoteMintAddress: string;
  quoteSize: string;
  signature: string;
  slot: number;
  txIndex: number;
}
export interface TokenTransfer {
  amount: number;
  blockTime: number;
  calculatedAmount: string;
  callingMetadata: {
    callingInstructions: any;
    callingProgram: string;
    ixName: string;
    programName: string;
  }[];
  decimal: number;
  feePayer: string;
  mintAddress: string;
  price: string;
  receiverAddress: string | null;
  receiverTokenAccount: string | null;
  senderAddress: string;
  senderTokenAccount: string | null;
  signature: string;
  slot: number;
  valueUsd: string;
}

export interface PriceData {
  close: string;
  count: number;
  high: string;
  low: string;
  open: string;
  time: string;
  volume: string;
}