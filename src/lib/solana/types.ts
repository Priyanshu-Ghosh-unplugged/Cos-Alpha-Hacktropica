/**
 * Solana Types
 * 
 * Core TypeScript interfaces for Solana integration.
 */

import type { PublicKey, Transaction } from '@solana/web3.js';

export type SolanaNetwork = 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';

export interface SolanaConfig {
  network: SolanaNetwork;
  rpcEndpoint: string;
  wsEndpoint?: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

export interface SolanaWallet {
  id: string;
  name: string;
  publicKey: string;
  secretKey?: number[];
  isActive: boolean;
  network: SolanaNetwork;
  createdAt: string;
}

export interface SolanaBalance {
  lamports: number;
  sol: number;
  tokens: {
    mint: string;
    amount: number;
    decimals: number;
    uiAmount: number;
  }[];
}

export interface SolanaAccountInfo {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data: Uint8Array;
}

export interface TransactionRequest {
  instructions: {
    programId: string;
    keys: {
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }[];
    data: Uint8Array;
  }[];
  signers?: string[];
  feePayer?: string;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  slot?: number;
  confirmations?: number;
  error?: string;
}

export interface DeFiStrategy {
  id: string;
  name: string;
  type: 'swap' | 'stake' | 'lend' | 'yield_farm';
  parameters: Record<string, unknown>;
  estimatedReturn?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MultisigConfig {
  threshold: number;
  owners: string[];
  programId?: string;
}

export interface SecurityEvent {
  id: string;
  eventType: 'key_created' | 'key_destroyed' | 'policy_updated' | 'emergency_shutdown';
  metadata: Record<string, unknown>;
  hash: string;
  timestamp: string;
}

export interface OnChainActivity {
  id: string;
  type: 'transaction' | 'multisig_setup' | 'defi_strategy' | 'security_event';
  description: string;
  network: SolanaNetwork;
  timestamp: string;
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: Record<string, unknown>;
}
