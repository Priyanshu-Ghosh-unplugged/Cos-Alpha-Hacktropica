/**
 * Algorand Integration for Cos-alpha
 * 
 * Complete integration of Algorand blockchain for payments and agentic operations.
 * 
 * Implementation based on:
 * - Algorand Developer Portal: https://dev.algorand.co
 * - AlgoKit: https://dev.algorand.co/getting-started/algokit-quick-start/
 * - x402 Protocol: https://algorand.co/agentic-commerce/x402
 * 
 * @module algorand
 */

// Types
export type {
  AlgorandNetwork,
  AlgorandConfig,
  AlgorandWallet,
  AlgorandAsset,
  AlgorandBalance,
  PaymentRequest,
  PaymentResult,
  X402PaymentRequirements,
  X402PaymentProof,
  HeavyTaskRequest,
  HeavyTaskResult,
  WorkloadType,
  WorkloadEstimate,
  BudgetConfig,
  BudgetStatus,
  OnChainActivity,
} from './types';

// Configuration
export {
  ALGORAND_NETWORKS,
  ALGORAND_CAIP2_IDS,
  DEFAULT_NETWORK,
  ALGO_ASSET_ID,
  USDC_TESTNET_ASSET_ID,
  USDC_MAINNET_ASSET_ID,
  MIN_BALANCE_PER_ACCOUNT,
  MIN_BALANCE_PER_ASSET,
  MIN_TX_FEE,
  MAX_TX_FEE,
  X402_CONFIG,
  DEFAULT_BUDGET_CONFIG,
  STORAGE_KEYS,
  getNetworkConfig,
  getCaip2ChainId,
  isMainnet,
  formatAlgoAmount,
  parseAlgoAmount,
} from './config';

// Wallet Management
export {
  createWallet,
  importWallet,
  getWalletSecretKey,
  getAllWallets,
  getWalletById,
  getWalletByAddress,
  getActiveWallet,
  setActiveWallet,
  updateWalletName,
  deleteWallet,
  isValidAddress,
  getAccountInfo,
  getSuggestedParams,
} from './wallet';

// Payments & Balance
export {
  getBalance,
  getWalletBalance,
  formatAlgoBalance,
  formatAssetAmount,
  sendPayment,
  sendAlgoPayment,
  hasSufficientBalance,
  optInToAsset,
} from './payments';

// x402 Facilitator
export {
  classifyTask,
  createHeavyTaskRequest,
  createX402Requirements,
  payForHeavyTask,
  verifyPaymentProof,
  getPendingTasks,
  cancelHeavyTask,
  clearPendingTasks,
  estimateTaskCost,
} from './x402';

// Budget Management
export {
  getBudgetConfig,
  setBudgetConfig,
  getBudgetStatus,
  recordTransaction,
  checkBudget,
  resetDailyBudget,
  getBudgetSummary,
  setDefaultBudget,
  setTestnetBudget,
  setMainnetBudget,
} from './budget';

// Activity Logging
export {
  logActivity,
  logPaymentActivity,
  logHeavyTaskActivity,
  logContractInteraction,
  logBudgetUpdate,
  getAllActivities,
  getActivitiesByType,
  getActivitiesByStatus,
  getRecentActivities,
  getActivityById,
  updateActivity,
  updateActivityStatus,
  clearAllActivities,
  getActivityStats,
  getActivitiesInRange,
  formatActivity,
  exportActivities,
} from './activity';

// Tool Interfaces (for Windsurf/Cos-alpha MCP)
export {
  // Wallet tools
  cosalpha_algorand_get_wallets,
  cosalpha_algorand_create_wallet,
  cosalpha_algorand_import_wallet,
  cosalpha_algorand_set_active_wallet,
  
  // Balance tools
  cosalpha_algorand_get_balance,
  
  // Payment tools
  cosalpha_algorand_send_payment,
  
  // Heavy task / x402 tools
  cosalpha_estimate_workload,
  cosalpha_create_heavy_task,
  cosalpha_pay_for_heavy_task,
  cosalpha_get_pending_tasks,
  
  // Budget tools
  cosalpha_get_budget,
  cosalpha_set_budget,
  
  // Activity tools
  cosalpha_get_activity,
} from './tools';
