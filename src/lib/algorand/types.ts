/**
 * Algorand Integration Types
 * 
 * Based on Algorand Developer Portal:
 * - https://dev.algorand.co
 * - https://dev.algorand.co/getting-started/algokit-quick-start/
 */

export type AlgorandNetwork = 'mainnet' | 'testnet' | 'betanet' | 'localnet';

export interface AlgorandConfig {
  network: AlgorandNetwork;
  algodToken: string;
  algodServer: string;
  algodPort: number;
  indexerToken?: string;
  indexerServer?: string;
  indexerPort?: number;
}

export interface AlgorandWallet {
  id: string;
  name: string;
  address: string;
  mnemonic?: string; // Only stored if user explicitly allows
  isActive: boolean;
  network: AlgorandNetwork;
  createdAt: string;
}

export interface AlgorandAsset {
  id: number; // ASA ID, 0 for ALGO
  name: string;
  unitName: string;
  decimals: number;
  amount: bigint;
}

export interface AlgorandBalance {
  address: string;
  algoBalance: bigint;
  algoBalanceFormatted: string;
  assets: AlgorandAsset[];
  round: number;
}

export interface PaymentRequest {
  fromWalletId: string;
  toAddress: string;
  amount: bigint;
  assetId?: number; // 0 or undefined for ALGO
  note?: string;
}

export interface PaymentResult {
  txId: string;
  confirmedRound: number;
  fromAddress: string;
  toAddress: string;
  amount: bigint;
  assetId: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

// x402 Payment Protocol Types
// Based on: https://algorand.co/agentic-commerce/x402

export interface X402PaymentRequirements {
  scheme: 'x402';
  network: string; // CAIP-2 chain ID, e.g., 'algorand:testnet-v1.0'
  requiredAmount: bigint;
  asset: string; // Asset ID or 'ALGO'
  recipientAddress: string;
  facilitatorUrl?: string;
  deadline?: number; // Unix timestamp
  metadata?: Record<string, unknown>;
}

export interface X402PaymentProof {
  transactionId: string;
  network: string;
  amount: bigint;
  asset: string;
  recipient: string;
  timestamp: number;
  signature?: string; // Facilitator signature if applicable
}

export interface HeavyTaskRequest {
  taskId: string;
  taskType: string;
  description: string;
  estimatedCost: {
    amount: bigint;
    asset: string;
    usdEquivalent?: number;
  };
  requiredResources: string[];
  deadline: number;
}

export interface HeavyTaskResult {
  taskId: string;
  success: boolean;
  paymentTxId?: string;
  executionTxId?: string;
  result?: unknown;
  error?: string;
  timestamp: string;
}

// Workload Classification Types

export type WorkloadType = 'light' | 'heavy' | 'chargeable';

export interface WorkloadEstimate {
  type: WorkloadType;
  estimatedCalls: number;
  estimatedTokens?: number;
  estimatedComputeUnits?: number;
  requiresPayment: boolean;
  estimatedCost?: {
    amount: bigint;
    asset: string;
    usdEquivalent?: number;
  };
  description: string;
}

// Budget Types

export interface BudgetConfig {
  dailyLimit: bigint;
  perTaskLimit: bigint;
  asset: string;
  warningThreshold: number; // Percentage (0-100)
}

export interface BudgetStatus {
  dailySpent: bigint;
  dailyRemaining: bigint;
  dailyLimit: bigint;
  lastReset: string;
  transactionsToday: number;
}

// Activity Logging Types

export interface OnChainActivity {
  id: string;
  type: 'payment' | 'heavy_task' | 'contract_interaction' | 'budget_update';
  description: string;
  txId?: string;
  network: AlgorandNetwork;
  amount?: bigint;
  asset?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}
