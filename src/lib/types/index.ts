// types/context.ts
// lib/types.ts
import { Context, Scenes } from "telegraf";
import { TokenTrade, PriceData } from "./api";

export interface SessionData extends Scenes.SceneSession<any> {
  ohlcvData?: any[];
  ohlcvPage?: number;
  tokenAddress?: string;
  tokenTradesFilters?: {
    baseMintAddress?: string;
    quoteMintAddress?: string;
    resolution?: string;
    timeStart?: number;
    timeEnd?: number;
    sortBy?: string;
    limit?: number;
  };
  tokenTradesData?: TokenTrade[]; // Added to store all trades
  tokenTradesPage?: number; // Added to track current page
  tokenTransferFilters?: {
    mintAddress?: string;
    signature?: string;
    senderAddress?: string;
    recieverAddress?: string;
  };
  tokenVolumeFilters?: {
    mintAddress?: string;
    startTime?: number;
    endTime?: number;
    interval?: string;
    currentParam?: string;
  };
  tokenVolumeData?: any[];
  tokenVolumePage?: number;
  holdersTSData?: any[];
  holdersTSPage?: number;
  priceFilters?: {
    baseMintAddress?: string;
    quoteMintAddress?: string;
    programId?: string;
    resolution?: string;
    timeStart?: number;
    timeEnd?: number;
    page?: number;
    limit?: number;
    currentParam?: string;
  };
  priceData?: PriceData[];
  pricePage?: number;
}

export interface CustomContext extends Context {
  session: SessionData;
  scene: Scenes.SceneContextScene<CustomContext, any>;
  wizard: Scenes.WizardContextWizard<CustomContext>;
  match?: RegExpMatchArray;
}

export interface TokenDetails {
  category: string | null;
  currentSupply: number;
  decimal: number;
  logoUrl: string | null;
  marketCap: number;
  mintAddress: string;
  name: string | null;
  price: number;
  price1d: number;
  price7d: number;
  subcategory: string | null;
  symbol: string;
  tokenAmountVolume24h: number | null;
  updateTime: number;
  usdValueVolume24h: number | null;
  verified: boolean;
}
