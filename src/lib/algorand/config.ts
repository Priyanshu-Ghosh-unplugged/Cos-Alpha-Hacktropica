/**
 * Algorand Network Configuration
 * 
 * References:
 * - Algorand Developer Portal: https://dev.algorand.co
 * - AlgoKit Quick Start: https://dev.algorand.co/getting-started/algokit-quick-start/
 */

import type { AlgorandConfig, AlgorandNetwork } from './types';

// Network-specific configurations
export const ALGORAND_NETWORKS: Record<AlgorandNetwork, AlgorandConfig> = {
  mainnet: {
    network: 'mainnet',
    algodToken: '',
    algodServer: 'https://mainnet-api.algonode.cloud',
    algodPort: 443,
    indexerServer: 'https://mainnet-idx.algonode.cloud',
    indexerPort: 443,
  },
  testnet: {
    network: 'testnet',
    algodToken: '',
    algodServer: 'https://testnet-api.algonode.cloud',
    algodPort: 443,
    indexerServer: 'https://testnet-idx.algonode.cloud',
    indexerPort: 443,
  },
  betanet: {
    network: 'betanet',
    algodToken: '',
    algodServer: 'https://betanet-api.algonode.cloud',
    algodPort: 443,
    indexerServer: 'https://betanet-idx.algonode.cloud',
    indexerPort: 443,
  },
  localnet: {
    network: 'localnet',
    algodToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    algodServer: 'http://localhost',
    algodPort: 4001,
    indexerServer: 'http://localhost',
    indexerPort: 8980,
  },
};

// CAIP-2 Chain IDs for x402 protocol
export const ALGORAND_CAIP2_IDS: Record<AlgorandNetwork, string> = {
  mainnet: 'algorand:v1.0',
  testnet: 'algorand:testnet-v1.0',
  betanet: 'algorand:betanet-v1.0',
  localnet: 'algorand:localnet-v1.0',
};

// Default network (testnet for development safety)
export const DEFAULT_NETWORK: AlgorandNetwork = 'testnet';

// Asset IDs
export const ALGO_ASSET_ID = 0;
export const USDC_TESTNET_ASSET_ID = 10458941; // Testnet USDC
export const USDC_MAINNET_ASSET_ID = 31566704; // Mainnet USDC

// Minimum balance requirements (in microAlgos)
export const MIN_BALANCE_PER_ACCOUNT = 100000; // 0.1 ALGO
export const MIN_BALANCE_PER_ASSET = 100000; // 0.1 ALGO per opt-in asset

// Transaction fees (in microAlgos)
export const MIN_TX_FEE = 1000;
export const MAX_TX_FEE = 100000;

// x402 Configuration
export const X402_CONFIG = {
  scheme: 'x402' as const,
  defaultFacilitatorUrl: 'https://facilitator.x402.org',
  paymentTimeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// Budget defaults
export const DEFAULT_BUDGET_CONFIG = {
  dailyLimit: BigInt(5000000), // 5 ALGO in microAlgos
  perTaskLimit: BigInt(1000000), // 1 ALGO in microAlgos
  asset: 'ALGO',
  warningThreshold: 80, // 80%
};

// Storage keys
export const STORAGE_KEYS = {
  wallets: 'cosalpha_algorand_wallets',
  activeWallet: 'cosalpha_algorand_active_wallet',
  budget: 'cosalpha_algorand_budget',
  activity: 'cosalpha_algorand_activity',
  config: 'cosalpha_algorand_config',
};

/**
 * Get configuration for a specific network
 */
export function getNetworkConfig(network: AlgorandNetwork = DEFAULT_NETWORK): AlgorandConfig {
  return ALGORAND_NETWORKS[network];
}

/**
 * Get CAIP-2 chain ID for a network
 */
export function getCaip2ChainId(network: AlgorandNetwork): string {
  return ALGORAND_CAIP2_IDS[network];
}

/**
 * Check if network is mainnet (requires extra caution)
 */
export function isMainnet(network: AlgorandNetwork): boolean {
  return network === 'mainnet';
}

/**
 * Format microAlgos to ALGO string
 */
export function formatAlgoAmount(microAlgos: bigint): string {
  const algo = Number(microAlgos) / 1000000;
  return `${algo.toFixed(6)} ALGO`;
}

/**
 * Parse ALGO string to microAlgos
 */
export function parseAlgoAmount(algoString: string): bigint {
  const algo = parseFloat(algoString);
  if (isNaN(algo) || algo < 0) {
    throw new Error('Invalid ALGO amount');
  }
  return BigInt(Math.round(algo * 1000000));
}
