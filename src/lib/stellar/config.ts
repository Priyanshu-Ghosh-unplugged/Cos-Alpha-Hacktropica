/**
 * Stellar Configuration
 * 
 * Network settings and constants for Stellar integration.
 */

import type { StellarConfig, StellarNetwork, StellarAsset } from './types';

export const STELLAR_NETWORKS: Record<StellarNetwork, StellarConfig> = {
  public: {
    network: 'public',
    horizonServer: 'https://horizon.stellar.org',
    passphrase: 'Public Global Stellar Network ; September 2015',
  },
  testnet: {
    network: 'testnet',
    horizonServer: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
  },
  futurenet: {
    network: 'futurenet',
    horizonServer: 'https://horizon-futurenet.stellar.org',
    passphrase: 'Test SDF Future Network ; October 2024',
  },
};

export const NATIVE_ASSET: StellarAsset = {
  code: 'XLM',
  type: 'native',
};

export const DEFAULT_NETWORK: StellarNetwork = 'testnet';

export const BASE_FEE = 100; // stroops
export const MIN_BALANCE = 10000000; // 1 XLM in stroops

export const STORAGE_KEYS = {
  wallets: 'cosalpha_stellar_wallets',
  activeWallet: 'cosalpha_stellar_active',
  activity: 'cosalpha_stellar_activity',
};

export function getNetworkConfig(network: StellarNetwork = DEFAULT_NETWORK): StellarConfig {
  return STELLAR_NETWORKS[network];
}

export function isPublicNetwork(network: StellarNetwork): boolean {
  return network === 'public';
}

export function formatStroops(stroops: number | string): string {
  const amount = Number(stroops) / 10000000;
  return `${amount.toFixed(7)} XLM`;
}

export function parseXlmToStroops(xlm: string | number): string {
  const amount = Number(xlm) * 10000000;
  return Math.floor(amount).toString();
}
