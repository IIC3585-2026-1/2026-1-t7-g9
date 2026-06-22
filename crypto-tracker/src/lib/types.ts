export type CryptoOption = {
  id: string;
  symbol: string;
  name: string;
  image: string;
};

export type CryptoMarket = CryptoOption & {
  current_price: number;
  market_cap_rank: number;
};

export type CryptoChangedDetail = {
  selectedIds: string[];
  selectedCryptos: CryptoOption[];
};

export type CryptoPrice = {
  usd: number;
  usd_24h_change?: number;
};

export type CryptoPrices = Record<string, CryptoPrice>;

export const CRYPTO_SELECTION_STORAGE_KEY = "crypto-tracker:selected-cryptos";

declare global {
  interface WindowEventMap {
    "crypto-changed": CustomEvent<CryptoChangedDetail>;
  }
}
