import type { CryptoMarket } from "./types";

export type { CryptoMarket } from "./types";

const fallbackCryptos: CryptoMarket[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 0,
    market_cap_rank: 1,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 0,
    market_cap_rank: 2,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 0,
    market_cap_rank: 6,
  },
  {
    id: "cardano",
    symbol: "ada",
    name: "Cardano",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    current_price: 0,
    market_cap_rank: 10,
  },
  {
    id: "dogecoin",
    symbol: "doge",
    name: "Dogecoin",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    current_price: 0,
    market_cap_rank: 8,
  },
];

export async function getCryptos(): Promise<CryptoMarket[]> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
    );

    if (!res.ok) {
      throw new Error("Error fetching cryptos");
    }

    return await res.json();
  } catch {
    return fallbackCryptos;
  }
}
