/**
 * Stellar Types
 * 
 * Core TypeScript interfaces for Stellar integration.
 */

export type StellarNetwork = 'public' | 'testnet' | 'futurenet';

export interface StellarConfig {
  network: StellarNetwork;
  horizonServer: string;
  passphrase: string;
}

export interface StellarWallet {
  id: string;
  name: string;
  publicKey: string;
  secretKey?: string;
  isActive: boolean;
  network: StellarNetwork;
  createdAt: string;
}

export interface StellarAsset {
  code: string;
  issuer?: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}

export interface StellarBalance {
  asset: StellarAsset;
  balance: string;
  limit?: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
}

export interface StellarAccountInfo {
  id: string;
  sequence: string;
  balances: StellarBalance[];
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  signers: {
    key: string;
    weight: number;
    type: string;
  }[];
  subentryCount: number;
  lastModifiedLedger: number;
}

export interface PaymentRequest {
  destination: string;
  amount: string;
  asset: StellarAsset;
  memo?: string;
  memoType?: 'text' | 'id' | 'hash' | 'return';
}

export interface PaymentResult {
  success: boolean;
  hash?: string;
  ledger?: number;
  error?: string;
}

export interface MultisigConfig {
  signers: {
    publicKey: string;
    weight: number;
  }[];
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface OnChainActivity {
  id: string;
  type: 'payment' | 'multisig_setup' | 'trustline' | 'account_created';
  description: string;
  network: StellarNetwork;
  timestamp: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: Record<string, unknown>;
}
