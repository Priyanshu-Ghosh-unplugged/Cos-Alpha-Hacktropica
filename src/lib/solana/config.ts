/**
 * Solana Configuration
 * 
 * Network settings and constants for Solana integration.
 */

import type { SolanaConfig, SolanaNetwork } from './types';

export const SOLANA_NETWORKS: Record<SolanaNetwork, SolanaConfig> = {
  'mainnet-beta': {
    network: 'mainnet-beta',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
    commitment: 'confirmed',
  },
  testnet: {
    network: 'testnet',
    rpcEndpoint: 'https://api.testnet.solana.com',
    wsEndpoint: 'wss://api.testnet.solana.com',
    commitment: 'confirmed',
  },
  devnet: {
    network: 'devnet',
    rpcEndpoint: 'https://api.devnet.solana.com',
    wsEndpoint: 'wss://api.devnet.solana.com',
    commitment: 'confirmed',
  },
  localnet: {
    network: 'localnet',
    rpcEndpoint: 'http://localhost:8899',
    wsEndpoint: 'ws://localhost:8900',
    commitment: 'confirmed',
  },
};

export const DEFAULT_NETWORK: SolanaNetwork = 'devnet';

export const LAMPORTS_PER_SOL = 1000000000;

export const DEFAULT_COMMITMENT = 'confirmed';

export const STORAGE_KEYS = {
  wallets: 'cosalpha_solana_wallets',
  activeWallet: 'cosalpha_solana_active',
  activity: 'cosalpha_solana_activity',
};

export function getNetworkConfig(network: SolanaNetwork = DEFAULT_NETWORK): SolanaConfig {
  return SOLANA_NETWORKS[network];
}

export function isMainnet(network: SolanaNetwork): boolean {
  return network === 'mainnet-beta';
}

export function formatLamports(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return `${sol.toFixed(9)} SOL`;
}

export function parseSolToLamports(sol: string | number): number {
  return Math.floor(Number(sol) * LAMPORTS_PER_SOL);
}
