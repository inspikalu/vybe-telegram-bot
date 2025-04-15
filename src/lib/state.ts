// src/lib/state.ts

// Types for pagination
export interface PaginationData {
    tokenAddress: string;
    tokenSymbol: string;
    totalCount: number;
    totalPercentage: number;
    currentPage: number;
  }
  
  // Global state stores
  export const holdersPaginationStore = new Map<number, PaginationData>();
  
  // You can add other shared state stores here as needed