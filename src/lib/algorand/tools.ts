/**
 * Cos-alpha Algorand Tool Interfaces
 * 
 * MCP/HTTP tool definitions for Windsurf integration.
 * These are the exposed functions that the AI agent can call.
 * 
 * Based on the integration plan:
 * - cosalpha_algorand_get_balance
 * - cosalpha_algorand_send_payment  
 * - cosalpha_pay_for_heavy_task
 */

import type { 
  AlgorandBalance, 
  PaymentResult, 
  HeavyTaskRequest, 
  HeavyTaskResult,
  WorkloadEstimate,
  AlgorandNetwork 
} from './types';
import { 
  getBalance, 
  getWalletBalance, 
  sendPayment, 
  sendAlgoPayment,
  hasSufficientBalance 
} from './payments';
import { 
  getActiveWallet, 
  getWalletById, 
  getAllWallets, 
  createWallet, 
  importWallet,
  setActiveWallet,
  isValidAddress 
} from './wallet';
import { 
  classifyTask, 
  createHeavyTaskRequest, 
  payForHeavyTask,
  estimateTaskCost,
  getPendingTasks 
} from './x402';
import { 
  getBudgetConfig, 
  setBudgetConfig, 
  getBudgetStatus, 
  getBudgetSummary,
  checkBudget,
  recordTransaction 
} from './budget';
import { 
  logActivity, 
  logPaymentActivity, 
  logHeavyTaskActivity,
  getRecentActivities,
  getActivityStats 
} from './activity';
import { DEFAULT_NETWORK, formatAlgoAmount } from './config';

// ============================================================================
// Wallet Management Tools
// ============================================================================

/**
 * Tool: cosalpha_algorand_get_wallets
 * Get all stored wallets
 */
export function cosalpha_algorand_get_wallets(): {
  id: string;
  name: string;
  address: string;
  network: string;
  isActive: boolean;
}[] {
  return getAllWallets().map(w => ({
    id: w.id,
    name: w.name,
    address: w.address,
    network: w.network,
    isActive: w.isActive,
  }));
}

/**
 * Tool: cosalpha_algorand_create_wallet
 * Create a new Algorand wallet
 */
export function cosalpha_algorand_create_wallet(
  name: string,
  network: AlgorandNetwork = DEFAULT_NETWORK,
  storeMnemonic: boolean = false
): { 
  success: boolean; 
  wallet: { id: string; name: string; address: string; network: string } | null;
  mnemonic?: string;
  error?: string;
} {
  try {
    const { wallet, mnemonic } = createWallet(name, network, storeMnemonic);
    
    logActivity('payment', `Created wallet: ${wallet.name} (${wallet.address.slice(0, 8)}...)`, network);
    
    return {
      success: true,
      wallet: {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        network: wallet.network,
      },
      mnemonic: storeMnemonic ? undefined : mnemonic, // Only return if not stored
    };
  } catch (error) {
    return {
      success: false,
      wallet: null,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    };
  }
}

/**
 * Tool: cosalpha_algorand_import_wallet
 * Import an existing wallet from mnemonic
 */
export function cosalpha_algorand_import_wallet(
  name: string,
  mnemonic: string,
  network: AlgorandNetwork = DEFAULT_NETWORK,
  storeMnemonic: boolean = false
): {
  success: boolean;
  wallet: { id: string; name: string; address: string; network: string } | null;
  error?: string;
} {
  try {
    const wallet = importWallet(name, mnemonic, network, storeMnemonic);
    
    logActivity('payment', `Imported wallet: ${wallet.name} (${wallet.address.slice(0, 8)}...)`, network);
    
    return {
      success: true,
      wallet: {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        network: wallet.network,
      },
    };
  } catch (error) {
    return {
      success: false,
      wallet: null,
      error: error instanceof Error ? error.message : 'Failed to import wallet',
    };
  }
}

/**
 * Tool: cosalpha_algorand_set_active_wallet
 * Set the active wallet for operations
 */
export function cosalpha_algorand_set_active_wallet(walletId: string): {
  success: boolean;
  error?: string;
} {
  const success = setActiveWallet(walletId);
  
  if (success) {
    const wallet = getWalletById(walletId);
    if (wallet) {
      logActivity('payment', `Set active wallet: ${wallet.name}`, wallet.network);
    }
  }
  
  return {
    success,
    error: success ? undefined : 'Wallet not found',
  };
}

// ============================================================================
// Balance Tools
// ============================================================================

/**
 * Tool: cosalpha_algorand_get_balance
 * Get balance for a wallet or address
 */
export async function cosalpha_algorand_get_balance(
  walletId?: string,
  address?: string,
  network?: AlgorandNetwork
): Promise<{
  success: boolean;
  balance: {
    address: string;
    algoBalance: string;
    assets: { id: number; name: string; unitName: string; amount: string }[];
    round: number;
  } | null;
  error?: string;
}> {
  try {
    let result: AlgorandBalance;
    
    if (address) {
      if (!isValidAddress(address)) {
        return {
          success: false,
          balance: null,
          error: 'Invalid Algorand address',
        };
      }
      result = await getBalance(address, network || DEFAULT_NETWORK);
    } else {
      const balance = await getWalletBalance(walletId, network);
      if (!balance) {
        return {
          success: false,
          balance: null,
          error: 'Wallet not found',
        };
      }
      result = balance;
    }
    
    return {
      success: true,
      balance: {
        address: result.address,
        algoBalance: formatAlgoAmount(result.algoBalance),
        assets: result.assets.map(a => ({
          id: a.id,
          name: a.name,
          unitName: a.unitName,
          amount: a.amount.toString(),
        })),
        round: result.round,
      },
    };
  } catch (error) {
    return {
      success: false,
      balance: null,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

// ============================================================================
// Payment Tools
// ============================================================================

/**
 * Tool: cosalpha_algorand_send_payment
 * Send a payment (ALGO or ASA)
 */
export async function cosalpha_algorand_send_payment(
  toAddress: string,
  amount: string, // in ALGO or asset units (not micro)
  assetId: number = 0, // 0 for ALGO
  walletId?: string,
  note?: string,
  network?: AlgorandNetwork
): Promise<{
  success: boolean;
  result: {
    txId: string;
    confirmedRound: number;
    amount: string;
    asset: string;
    from: string;
    to: string;
  } | null;
  error?: string;
}> {
  // Validate address
  if (!isValidAddress(toAddress)) {
    return {
      success: false,
      result: null,
      error: 'Invalid recipient address',
    };
  }
  
  // Parse amount
  let amountBigInt: bigint;
  try {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount');
    }
    // Convert to microAlgos or asset base units
    amountBigInt = BigInt(Math.round(amountNum * 1000000));
  } catch {
    return {
      success: false,
      result: null,
      error: 'Invalid amount format',
    };
  }
  
  const wallet = walletId ? getWalletById(walletId) : getActiveWallet();
  if (!wallet) {
    return {
      success: false,
      result: null,
      error: 'No wallet available',
    };
  }
  
  const targetNetwork = network || wallet.network;
  
  // Check budget
  const budgetCheck = checkBudget(amountBigInt);
  if (!budgetCheck.allowed) {
    return {
      success: false,
      result: null,
      error: `Budget check failed: ${budgetCheck.reason}`,
    };
  }
  
  // Send payment
  const result = await sendPayment({
    fromWalletId: wallet.id,
    toAddress,
    amount: amountBigInt,
    assetId,
    note,
  }, targetNetwork);
  
  if (result.success) {
    // Record in budget
    recordTransaction(amountBigInt);
    
    // Log activity
    logPaymentActivity(result, targetNetwork);
    
    return {
      success: true,
      result: {
        txId: result.txId,
        confirmedRound: result.confirmedRound,
        amount: formatAlgoAmount(result.amount),
        asset: result.assetId === 0 ? 'ALGO' : `ASA-${result.assetId}`,
        from: result.fromAddress,
        to: result.toAddress,
      },
    };
  } else {
    return {
      success: false,
      result: null,
      error: result.error || 'Payment failed',
    };
  }
}

// ============================================================================
// Heavy Task / x402 Tools
// ============================================================================

/**
 * Tool: cosalpha_estimate_workload
 * Estimate if a task is Light or Heavy
 */
export function cosalpha_estimate_workload(
  taskType: string,
  description: string,
  complexity: 'low' | 'medium' | 'high' = 'medium'
): {
  isHeavy: boolean;
  reason: string;
  estimatedCost: {
    amount: string;
    asset: string;
    usdEquivalent: number;
  } | null;
} {
  const classification = classifyTask(taskType, description, complexity);
  
  if (classification.isHeavy) {
    const cost = estimateTaskCost(taskType, complexity);
    return {
      isHeavy: true,
      reason: classification.reason,
      estimatedCost: {
        amount: formatAlgoAmount(cost.amount),
        asset: cost.asset,
        usdEquivalent: Number(cost.amount) / 1000000 * 0.25, // Approx rate
      },
    };
  }
  
  return {
    isHeavy: false,
    reason: classification.reason,
    estimatedCost: null,
  };
}

/**
 * Tool: cosalpha_create_heavy_task
 * Create a heavy task request with cost estimate
 */
export function cosalpha_create_heavy_task(
  taskType: string,
  description: string,
  requiredResources: string[],
  baseCostMicroAlgos?: string
): {
  success: boolean;
  task: {
    taskId: string;
    description: string;
    estimatedCost: string;
    asset: string;
    deadline: string;
  } | null;
  error?: string;
} {
  try {
    const baseCost = baseCostMicroAlgos ? BigInt(baseCostMicroAlgos) : undefined;
    const request = createHeavyTaskRequest(taskType, description, requiredResources, baseCost);
    
    return {
      success: true,
      task: {
        taskId: request.taskId,
        description: request.description,
        estimatedCost: formatAlgoAmount(request.estimatedCost.amount),
        asset: request.estimatedCost.asset,
        deadline: new Date(request.deadline).toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      task: null,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}

/**
 * Tool: cosalpha_pay_for_heavy_task
 * Pay for and execute a heavy task
 */
export async function cosalpha_pay_for_heavy_task(
  taskId: string,
  walletId?: string,
  network?: AlgorandNetwork
): Promise<{
  success: boolean;
  result: {
    taskId: string;
    paymentTxId: string;
    confirmed: boolean;
  } | null;
  error?: string;
}> {
  const wallet = walletId ? getWalletById(walletId) : getActiveWallet();
  
  if (!wallet) {
    return {
      success: false,
      result: null,
      error: 'No wallet available',
    };
  }
  
  const targetNetwork = network || wallet.network;
  
  // Execute payment for task
  const result = await payForHeavyTask(taskId, wallet.id, targetNetwork);
  
  if (result.success) {
    // Log the activity
    logHeavyTaskActivity(result, targetNetwork);
    
    return {
      success: true,
      result: {
        taskId: result.taskId,
        paymentTxId: result.paymentTxId || '',
        confirmed: true,
      },
    };
  } else {
    return {
      success: false,
      result: null,
      error: result.error || 'Task payment failed',
    };
  }
}

/**
 * Tool: cosalpha_get_pending_tasks
 * Get all pending heavy tasks
 */
export function cosalpha_get_pending_tasks(): {
  taskId: string;
  taskType: string;
  description: string;
  estimatedCost: string;
  deadline: string;
}[] {
  return getPendingTasks().map(t => ({
    taskId: t.taskId,
    taskType: t.taskType,
    description: t.description,
    estimatedCost: formatAlgoAmount(t.estimatedCost.amount),
    deadline: new Date(t.deadline).toISOString(),
  }));
}

// ============================================================================
// Budget Tools
// ============================================================================

/**
 * Tool: cosalpha_get_budget
 * Get current budget status
 */
export function cosalpha_get_budget(): {
  config: {
    dailyLimit: string;
    perTaskLimit: string;
    warningThreshold: number;
  };
  status: {
    dailySpent: string;
    dailyRemaining: string;
    transactionsToday: number;
    percentUsed: number;
    isWarning: boolean;
    isExceeded: boolean;
  };
} {
  const config = getBudgetConfig();
  const summary = getBudgetSummary();
  
  return {
    config: {
      dailyLimit: formatAlgoAmount(config.dailyLimit),
      perTaskLimit: formatAlgoAmount(config.perTaskLimit),
      warningThreshold: config.warningThreshold,
    },
    status: {
      dailySpent: summary.dailySpent,
      dailyRemaining: summary.dailyRemaining,
      transactionsToday: summary.transactionsToday,
      percentUsed: summary.percentUsed,
      isWarning: summary.isWarning,
      isExceeded: summary.isExceeded,
    },
  };
}

/**
 * Tool: cosalpha_set_budget
 * Set budget configuration
 */
export function cosalpha_set_budget(
  dailyLimit: string, // in ALGO
  perTaskLimit: string, // in ALGO
  warningThreshold: number
): {
  success: boolean;
  config: {
    dailyLimit: string;
    perTaskLimit: string;
    warningThreshold: number;
  };
  error?: string;
} {
  try {
    const dailyLimitBigInt = BigInt(Math.round(parseFloat(dailyLimit) * 1000000));
    const perTaskLimitBigInt = BigInt(Math.round(parseFloat(perTaskLimit) * 1000000));
    
    const config = setBudgetConfig({
      dailyLimit: dailyLimitBigInt,
      perTaskLimit: perTaskLimitBigInt,
      warningThreshold,
    });
    
    return {
      success: true,
      config: {
        dailyLimit: formatAlgoAmount(config.dailyLimit),
        perTaskLimit: formatAlgoAmount(config.perTaskLimit),
        warningThreshold: config.warningThreshold,
      },
    };
  } catch (error) {
    return {
      success: false,
      config: {
        dailyLimit: '0 ALGO',
        perTaskLimit: '0 ALGO',
        warningThreshold: 0,
      },
      error: error instanceof Error ? error.message : 'Failed to set budget',
    };
  }
}

// ============================================================================
// Activity Tools
// ============================================================================

/**
 * Tool: cosalpha_get_activity
 * Get recent on-chain activity
 */
export function cosalpha_get_activity(limit: number = 10): {
  activities: {
    id: string;
    type: string;
    description: string;
    status: string;
    timestamp: string;
    txId?: string;
    amount?: string;
    asset?: string;
    network: string;
  }[];
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
    todayCount: number;
  };
} {
  const activities = getRecentActivities(limit);
  const stats = getActivityStats();
  
  return {
    activities: activities.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      status: a.status,
      timestamp: a.timestamp,
      txId: a.txId,
      amount: a.amount ? formatAlgoAmount(a.amount) : undefined,
      asset: a.asset,
      network: a.network,
    })),
    stats: {
      total: stats.total,
      pending: stats.pending,
      confirmed: stats.confirmed,
      failed: stats.failed,
      todayCount: stats.todayCount,
    },
  };
}
