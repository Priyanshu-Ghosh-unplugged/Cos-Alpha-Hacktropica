/**
 * Solana Module Index
 */

// Types
export type {
  SolanaNetwork,
  SolanaConfig,
  SolanaWallet,
  SolanaBalance,
  SolanaAccountInfo,
  TransactionRequest,
  TransactionResult,
  DeFiStrategy,
  MultisigConfig,
  SecurityEvent,
  OnChainActivity,
} from './types';

// Config
export {
  SOLANA_NETWORKS,
  DEFAULT_NETWORK,
  LAMPORTS_PER_SOL,
  DEFAULT_COMMITMENT,
  STORAGE_KEYS,
  getNetworkConfig,
  isMainnet,
  formatLamports,
  parseSolToLamports,
} from './config';

// Wallet
export {
  createWallet,
  importWallet,
  getAllWallets,
  getWalletById,
  getWalletSecret,
  getActiveWallet,
  setActiveWallet,
  updateWallet,
  deleteWallet,
  isValidPublicKey,
  getBalance,
  getAccountInfo,
  clearWalletsCache,
} from './wallet';

// Transactions
export {
  sendTransaction,
  transferSol,
  hasSufficientBalance,
  createDeFiStrategy,
  executeDeFiStrategy,
} from './transactions';

// Multisig
export {
  setupMultisig,
  proposeMultisigTransaction,
  approveMultisigTransaction,
  logSecurityEvent,
  getSecurityEvents,
} from './multisig';
