import { defineChain, getAddress, type Address, type Chain } from "viem";

export interface ArcNetwork {
  chainId: number;
  rpcUrl: string;
  /** USDC ERC-20 interface (6 decimals) on Arc. */
  usdc: Address;
  /** Deployed StreamPay address. */
  streamPay: Address;
  name?: string;
  explorerUrl?: string;
}

/**
 * Arc testnet parameters, verified against the live network. USDC is Arc's
 * native asset; `usdc` is its ERC-20 interface (6 decimals).
 */
export const arcTestnet: ArcNetwork = {
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  usdc: getAddress("0x3600000000000000000000000000000000000000"),
  streamPay: getAddress("0xd981229808c89e1689e025E7c5367d1154F1899D"),
  name: "Arc Testnet",
};

export function defineArcChain(net: ArcNetwork): Chain {
  return defineChain({
    id: net.chainId,
    name: net.name ?? `Arc ${net.chainId}`,
    nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
    rpcUrls: { default: { http: [net.rpcUrl] } },
    blockExplorers: net.explorerUrl
      ? { default: { name: "Explorer", url: net.explorerUrl } }
      : undefined,
  });
}

export const USDC_DECIMALS = 6;
