/**
 * Budget Management Module
 * 
 * Implements spending limits and budget tracking for Algorand operations.
 * Part of Phase 4: Safety, Budgets, and Observability
 */

import type { BudgetConfig, BudgetStatus, AlgorandNetwork } from './types';
import { DEFAULT_BUDGET_CONFIG, STORAGE_KEYS, DEFAULT_NETWORK } from './config';

// In-memory cache
let budgetConfigCache: BudgetConfig | null = null;
let budgetStatusCache: BudgetStatus | null = null;

/**
 * Get budget configuration
 */
export function getBudgetConfig(): BudgetConfig {
  if (budgetConfigCache === null) {
    const stored = localStorage.getItem(STORAGE_KEYS.budget);
    if (stored) {
      const parsed = JSON.parse(stored);
      budgetConfigCache = {
        ...DEFAULT_BUDGET_CONFIG,
        ...parsed,
        dailyLimit: BigInt(parsed.dailyLimit || DEFAULT_BUDGET_CONFIG.dailyLimit),
        perTaskLimit: BigInt(parsed.perTaskLimit || DEFAULT_BUDGET_CONFIG.perTaskLimit),
      };
    } else {
      budgetConfigCache = { ...DEFAULT_BUDGET_CONFIG };
    }
  }
  return { ...budgetConfigCache };
}

/**
 * Set budget configuration
 */
export function setBudgetConfig(config: Partial<BudgetConfig>): BudgetConfig {
  const current = getBudgetConfig();
  
  const newConfig: BudgetConfig = {
    dailyLimit: config.dailyLimit !== undefined ? config.dailyLimit : current.dailyLimit,
    perTaskLimit: config.perTaskLimit !== undefined ? config.perTaskLimit : current.perTaskLimit,
    asset: config.asset || current.asset,
    warningThreshold: config.warningThreshold !== undefined ? config.warningThreshold : current.warningThreshold,
  };
  
  budgetConfigCache = newConfig;
  localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify({
    ...newConfig,
    dailyLimit: newConfig.dailyLimit.toString(),
    perTaskLimit: newConfig.perTaskLimit.toString(),
  }));
  
  return { ...newConfig };
}

/**
 * Get current budget status
 */
export function getBudgetStatus(): BudgetStatus {
  if (budgetStatusCache === null) {
    const stored = localStorage.getItem(`${STORAGE_KEYS.budget}_status`);
    const today = new Date().toISOString().split('T')[0];
    
    if (stored) {
      const parsed = JSON.parse(stored);
      const lastReset = parsed.lastReset?.split('T')[0];
      
      // Reset if it's a new day
      if (lastReset !== today) {
        budgetStatusCache = createFreshStatus();
      } else {
        budgetStatusCache = {
          dailySpent: BigInt(parsed.dailySpent || 0),
          dailyRemaining: BigInt(parsed.dailyRemaining || 0),
          dailyLimit: BigInt(parsed.dailyLimit || 0),
          lastReset: parsed.lastReset,
          transactionsToday: parsed.transactionsToday || 0,
        };
      }
    } else {
      budgetStatusCache = createFreshStatus();
    }
  }
  
  return { ...budgetStatusCache };
}

/**
 * Record a transaction in the budget
 */
export function recordTransaction(amount: bigint): boolean {
  const config = getBudgetConfig();
  let status = getBudgetStatus();
  
  // Check if we need to reset for a new day
  const today = new Date().toISOString().split('T')[0];
  const lastResetDay = status.lastReset.split('T')[0];
  
  if (today !== lastResetDay) {
    status = createFreshStatus();
  }
  
  // Check per-task limit
  if (amount > config.perTaskLimit) {
    return false;
  }
  
  // Check daily limit
  if (status.dailySpent + amount > status.dailyLimit) {
    return false;
  }
  
  // Update status
  status.dailySpent += amount;
  status.dailyRemaining = status.dailyLimit - status.dailySpent;
  status.transactionsToday++;
  
  budgetStatusCache = status;
  saveBudgetStatus(status);
  
  return true;
}

/**
 * Check if a transaction would exceed budget
 */
export function checkBudget(amount: bigint): {
  allowed: boolean;
  reason?: string;
  warning?: string;
} {
  const config = getBudgetConfig();
  const status = getBudgetStatus();
  
  // Check per-task limit
  if (amount > config.perTaskLimit) {
    return {
      allowed: false,
      reason: `Amount exceeds per-task limit of ${config.perTaskLimit.toString()} microALGO`,
    };
  }
  
  // Check daily limit
  if (status.dailySpent + amount > status.dailyLimit) {
    return {
      allowed: false,
      reason: `Amount would exceed daily budget. Remaining: ${status.dailyRemaining.toString()} microALGO`,
    };
  }
  
  // Check warning threshold
  const spentPercent = Number(status.dailySpent) / Number(status.dailyLimit) * 100;
  let warning: string | undefined;
  
  if (spentPercent >= config.warningThreshold) {
    warning = `Warning: You have spent ${spentPercent.toFixed(1)}% of your daily budget`;
  }
  
  return {
    allowed: true,
    warning,
  };
}

/**
 * Reset daily budget (manual reset)
 */
export function resetDailyBudget(): BudgetStatus {
  const fresh = createFreshStatus();
  budgetStatusCache = fresh;
  saveBudgetStatus(fresh);
  return fresh;
}

/**
 * Get budget summary for display
 */
export function getBudgetSummary(): {
  dailyLimit: string;
  dailySpent: string;
  dailyRemaining: string;
  perTaskLimit: string;
  transactionsToday: number;
  warningThreshold: number;
  percentUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
} {
  const config = getBudgetConfig();
  const status = getBudgetStatus();
  
  const percentUsed = Number(status.dailySpent) / Number(status.dailyLimit) * 100;
  const isWarning = percentUsed >= config.warningThreshold;
  const isExceeded = status.dailySpent >= status.dailyLimit;
  
  return {
    dailyLimit: formatMicroAlgo(config.dailyLimit),
    dailySpent: formatMicroAlgo(status.dailySpent),
    dailyRemaining: formatMicroAlgo(status.dailyRemaining),
    perTaskLimit: formatMicroAlgo(config.perTaskLimit),
    transactionsToday: status.transactionsToday,
    warningThreshold: config.warningThreshold,
    percentUsed,
    isWarning,
    isExceeded,
  };
}

/**
 * Set default budget (safe defaults)
 */
export function setDefaultBudget(): BudgetConfig {
  return setBudgetConfig({ ...DEFAULT_BUDGET_CONFIG });
}

/**
 * Set testnet budget (higher limits for testing)
 */
export function setTestnetBudget(): BudgetConfig {
  return setBudgetConfig({
    dailyLimit: BigInt(10000000), // 10 ALGO
    perTaskLimit: BigInt(2000000), // 2 ALGO
    asset: 'ALGO',
    warningThreshold: 75,
  });
}

/**
 * Set mainnet budget (conservative limits)
 */
export function setMainnetBudget(): BudgetConfig {
  return setBudgetConfig({
    dailyLimit: BigInt(2000000), // 2 ALGO
    perTaskLimit: BigInt(500000), // 0.5 ALGO
    asset: 'ALGO',
    warningThreshold: 50,
  });
}

// Private helpers

function createFreshStatus(): BudgetStatus {
  const config = getBudgetConfig();
  
  return {
    dailySpent: BigInt(0),
    dailyRemaining: config.dailyLimit,
    dailyLimit: config.dailyLimit,
    lastReset: new Date().toISOString(),
    transactionsToday: 0,
  };
}

function saveBudgetStatus(status: BudgetStatus): void {
  localStorage.setItem(`${STORAGE_KEYS.budget}_status`, JSON.stringify({
    dailySpent: status.dailySpent.toString(),
    dailyRemaining: status.dailyRemaining.toString(),
    dailyLimit: status.dailyLimit.toString(),
    lastReset: status.lastReset,
    transactionsToday: status.transactionsToday,
  }));
}

/**
 * Clear budget cache (for testing)
 */
export function clearBudgetCache(): void {
  budgetConfigCache = null;
  budgetStatusCache = null;
}

function formatMicroAlgo(microAlgos: bigint): string {
  const algo = Number(microAlgos) / 1000000;
  return `${algo.toFixed(6)} ALGO`;
}
