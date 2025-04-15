import axios, { AxiosError, AxiosResponse } from "axios";
import { config } from "../config";
import { TokenDetails } from "./types";
import {
  TokenBalance,
  WalletTransfer,
  ApiResponse,
  TokenTradesParams,
  TokenTrade,
  TokenTransferParams,
  TokenTransfer,
} from "./types/api";

// Define types for API responses

// Create an Axios instance
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    "x-api-key": config.VYBE_API_KEY,
    // Authorization: `Bearer ${config.VYBE_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Generic function for handling requests
const handleRequest = async <T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>
): Promise<ApiResponse<T>> => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    console.error("Error from the api at line 34: ",error)
    const axiosError = error as AxiosError<{ message: string }>;
    console.error(
      "API Error:",
      axiosError.response?.data?.message || axiosError.message
    );
    throw new Error(
      axiosError.response?.data?.message || "An unexpected error occurred"
    );
  }
};

// API methods
export interface PriceDataParams {
  programId?: string;
  resolution?: string;
  timeStart?: number;
  timeEnd?: number;
  page?: number;
  limit?: number;
}

export const api = {
  getTokenBalances: (
    walletAddress: string
  ): Promise<ApiResponse<TokenBalance[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<TokenBalance[]>>(
        `/account/token-balance/${walletAddress}`
      )
    ),

  getNftBalances: (walletAddress: string): Promise<ApiResponse<any[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<any[]>>(
        `/account/nft-balance/${walletAddress}?includeNoPriceBalance=true`
      )
    ),

  getWalletTransfers: (
    walletAddress: string
  ): Promise<ApiResponse<WalletTransfer[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<WalletTransfer[]>>(`/token/transfers`, {
        params: { walletAddress, limit: 5, sortByDesc: "timeStart" },
      })
    ),

  getTokenBalanceHistory: (
    walletAddress: string,
    days: number = 14
  ): Promise<ApiResponse<any[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<any[]>>(
        `/account/token-balance-ts/${walletAddress}`,
        {
          params: { days },
        }
      )
    ),

  getTokenTopHolders: (tokenMintAddress: string): Promise<ApiResponse<any[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<any[]>>(
        `/token/${tokenMintAddress}/top-holders`
      )
    ),
  getTokenDetails: (mintAddress: string): Promise<ApiResponse<TokenDetails>> =>
    handleRequest(
      apiClient.get<ApiResponse<TokenDetails>>(`/token/${mintAddress}`)
    ),
  getTokenOHLCV: (tokenMintAddress: string): Promise<ApiResponse<any[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<any[]>>(
        `/price/${tokenMintAddress}/token-ohlcv`
      )
    ),
  getTokenTrades: (
    params: TokenTradesParams
  ): Promise<ApiResponse<TokenTrade[]>> =>
    handleRequest(
      apiClient.get<ApiResponse<TokenTrade[]>>("/token/trades", {
        params,
      })
    ),
  getTokenTransfers: (params: TokenTransferParams): Promise<ApiResponse<any>> =>
    handleRequest(
      apiClient.get<ApiResponse<any>>("/token/transfers", {
        params,
      })
    ),
  getTokenTransferVolume: (
    mintAddress: string,
    params: {
      startTime?: number;
      endTime?: number;
      interval?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<ApiResponse<any>> =>
    handleRequest(
      apiClient.get<ApiResponse<any>>(`/token/${mintAddress}/transfer-volume`, {
        params,
      })
    ),
  getTokenHoldersTS: (
    mintAddress: string,
    params: {
      startTime?: number;
      endTime?: number;
      interval?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<ApiResponse<any>> =>
    handleRequest(
      apiClient.get<ApiResponse<any>>(`/token/${mintAddress}/holders-ts`, {
        params,
      })
    ),
  async getPriceData(
    baseMintAddress: string,
    quoteMintAddress: string,
    params: PriceDataParams = {}
  ) {
    const queryParams = new URLSearchParams();
    
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.resolution) queryParams.append('resolution', params.resolution);
    if (params.timeStart) queryParams.append('timeStart', params.timeStart.toString());
    if (params.timeEnd) queryParams.append('timeEnd', params.timeEnd.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/price/${baseMintAddress}+${quoteMintAddress}/pair-ohlcv${
      queryString ? `?${queryString}` : ''
    }`;

    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching price data:', error);
      throw error;
    }
  },
};
