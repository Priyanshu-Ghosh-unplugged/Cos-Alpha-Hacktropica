/**
 * Stellar Module Index
 */

// Types
export type {
  StellarNetwork,
  StellarConfig,
  StellarWallet,
  StellarAsset,
  StellarBalance,
  StellarAccountInfo,
  PaymentRequest,
  PaymentResult,
  MultisigConfig,
  OnChainActivity,
} from './types';

// Config
export {
  STELLAR_NETWORKS,
  NATIVE_ASSET,
  DEFAULT_NETWORK,
  BASE_FEE,
  MIN_BALANCE,
  STORAGE_KEYS,
  getNetworkConfig,
  isPublicNetwork,
  formatStroops,
  parseXlmToStroops,
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
  getAccountInfo,
  clearWalletsCache,
} from './wallet';

// Payments
export {
  getBalance,
  sendPayment,
  changeTrust,
  hasSufficientBalance,
} from './payments';

// Multisig
export {
  createMultisigAccount,
  addSigner,
  removeSigner,
  setThresholds,
} from './multisig';
