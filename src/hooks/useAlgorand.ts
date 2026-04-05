/**
 * React Hooks for Algorand Integration
 * 
 * Provides convenient React hooks for interacting with Algorand functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  AlgorandWallet, 
  AlgorandBalance, 
  PaymentResult, 
  HeavyTaskResult,
  AlgorandNetwork,
  OnChainActivity,
  BudgetConfig,
  BudgetStatus 
} from '@/lib/algorand/types';
import {
  getAllWallets,
  getActiveWallet,
  setActiveWallet,
  createWallet,
  importWallet,
  deleteWallet,
  getWalletBalance,
  sendPayment,
  payForHeavyTask,
  classifyTask,
  createHeavyTaskRequest,
  estimateTaskCost,
  getBudgetConfig,
  getBudgetStatus,
  checkBudget,
  getBudgetSummary,
  getRecentActivities,
  getActivityStats,
  logActivity,
  DEFAULT_NETWORK,
  formatAlgoAmount,
} from '@/lib/algorand';

// ============================================================================
// useAlgorandWallets Hook
// ============================================================================

interface UseAlgorandWalletsReturn {
  wallets: AlgorandWallet[];
  activeWallet: AlgorandWallet | null;
  isLoading: boolean;
  error: string | null;
  setActive: (walletId: string) => Promise<boolean>;
  create: (name: string, network?: AlgorandNetwork, storeMnemonic?: boolean) => Promise<{ wallet: AlgorandWallet; mnemonic: string } | null>;
  import: (name: string, mnemonic: string, network?: AlgorandNetwork, storeMnemonic?: boolean) => Promise<AlgorandWallet | null>;
  remove: (walletId: string) => Promise<boolean>;
  refresh: () => void;
}

export function useAlgorandWallets(): UseAlgorandWalletsReturn {
  const [wallets, setWallets] = useState<AlgorandWallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<AlgorandWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      const allWallets = getAllWallets();
      const active = getActiveWallet();
      setWallets(allWallets);
      setActiveWalletState(active);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActive = useCallback(async (walletId: string): Promise<boolean> => {
    try {
      const success = setActiveWallet(walletId);
      if (success) {
        refresh();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set active wallet');
      return false;
    }
  }, [refresh]);

  const create = useCallback(async (
    name: string,
    network: AlgorandNetwork = DEFAULT_NETWORK,
    storeMnemonic: boolean = false
  ): Promise<{ wallet: AlgorandWallet; mnemonic: string } | null> => {
    try {
      const result = createWallet(name, network, storeMnemonic);
      refresh();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      return null;
    }
  }, [refresh]);

  const importWalletFn = useCallback(async (
    name: string,
    mnemonic: string,
    network: AlgorandNetwork = DEFAULT_NETWORK,
    storeMnemonic: boolean = false
  ): Promise<AlgorandWallet | null> => {
    try {
      const wallet = importWallet(name, mnemonic, network, storeMnemonic);
      refresh();
      return wallet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
      return null;
    }
  }, [refresh]);

  const remove = useCallback(async (walletId: string): Promise<boolean> => {
    try {
      const success = deleteWallet(walletId);
      if (success) {
        refresh();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wallet');
      return false;
    }
  }, [refresh]);

  return {
    wallets,
    activeWallet,
    isLoading,
    error,
    setActive,
    create,
    import: importWalletFn,
    remove,
    refresh,
  };
}

// ============================================================================
// useAlgorandBalance Hook
// ============================================================================

interface UseAlgorandBalanceReturn {
  balance: AlgorandBalance | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAlgorandBalance(
  walletId?: string,
  network?: AlgorandNetwork,
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): UseAlgorandBalanceReturn {
  const [balance, setBalance] = useState<AlgorandBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getWalletBalance(walletId, network);
      setBalance(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [walletId, network]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, autoRefresh, refreshInterval]);

  return { balance, isLoading, error, refresh };
}

// ============================================================================
// useAlgorandPayment Hook
// ============================================================================

interface UseAlgorandPaymentReturn {
  send: (toAddress: string, amount: bigint, assetId?: number, note?: string) => Promise<PaymentResult>;
  isLoading: boolean;
  error: string | null;
  lastResult: PaymentResult | null;
}

export function useAlgorandPayment(
  walletId?: string,
  network?: AlgorandNetwork
): UseAlgorandPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);

  const send = useCallback(async (
    toAddress: string,
    amount: bigint,
    assetId: number = 0,
    note?: string
  ): Promise<PaymentResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const wallet = walletId ? { id: walletId } : getActiveWallet();
      if (!wallet) {
        const result: PaymentResult = {
          txId: '',
          confirmedRound: 0,
          fromAddress: '',
          toAddress,
          amount,
          assetId,
          timestamp: new Date().toISOString(),
          success: false,
          error: 'No wallet available',
        };
        setLastResult(result);
        return result;
      }

      const result = await sendPayment({
        fromWalletId: wallet.id,
        toAddress,
        amount,
        assetId,
        note,
      }, network);

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      
      const result: PaymentResult = {
        txId: '',
        confirmedRound: 0,
        fromAddress: '',
        toAddress,
        amount,
        assetId,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage,
      };
      setLastResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [walletId, network]);

  return { send, isLoading, error, lastResult };
}

// ============================================================================
// useHeavyTask Hook
// ============================================================================

interface UseHeavyTaskReturn {
  classify: (taskType: string, description: string, complexity: 'low' | 'medium' | 'high') => {
    isHeavy: boolean;
    reason: string;
    estimatedCost: { amount: bigint; asset: string; description: string } | null;
  };
  create: (taskType: string, description: string, requiredResources: string[], baseCost?: bigint) => {
    taskId: string;
    description: string;
    estimatedCost: { amount: bigint; asset: string };
    deadline: number;
  } | null;
  pay: (taskId: string) => Promise<HeavyTaskResult>;
  isLoading: boolean;
  error: string | null;
  lastResult: HeavyTaskResult | null;
}

export function useHeavyTask(
  walletId?: string,
  network?: AlgorandNetwork
): UseHeavyTaskReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<HeavyTaskResult | null>(null);

  const classify = useCallback((
    taskType: string,
    description: string,
    complexity: 'low' | 'medium' | 'high'
  ) => {
    const classification = classifyTask(taskType, description, complexity);
    
    if (classification.isHeavy) {
      const cost = estimateTaskCost(taskType, complexity);
      return {
        isHeavy: true,
        reason: classification.reason,
        estimatedCost: cost,
      };
    }
    
    return {
      isHeavy: false,
      reason: classification.reason,
      estimatedCost: null,
    };
  }, []);

  const create = useCallback((
    taskType: string,
    description: string,
    requiredResources: string[],
    baseCost?: bigint
  ) => {
    try {
      return createHeavyTaskRequest(taskType, description, requiredResources, baseCost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return null;
    }
  }, []);

  const pay = useCallback(async (taskId: string): Promise<HeavyTaskResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await payForHeavyTask(taskId, walletId, network);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Task payment failed';
      setError(errorMessage);
      
      const result: HeavyTaskResult = {
        taskId,
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
      setLastResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [walletId, network]);

  return { classify, create, pay, isLoading, error, lastResult };
}

// ============================================================================
// useAlgorandBudget Hook
// ============================================================================

interface BudgetSummary {
  dailyLimit: string;
  dailySpent: string;
  dailyRemaining: string;
  perTaskLimit: string;
  transactionsToday: number;
  percentUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

interface UseAlgorandBudgetReturn {
  config: BudgetConfig | null;
  status: BudgetStatus | null;
  summary: BudgetSummary | null;
  check: (amount: bigint) => { allowed: boolean; reason?: string; warning?: string };
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAlgorandBudget(): UseAlgorandBudgetReturn {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setIsLoading(true);
      
      const budgetConfig = getBudgetConfig();
      const budgetStatus = getBudgetStatus();
      const budgetSummary = getBudgetSummary();
      
      setConfig(budgetConfig);
      setStatus(budgetStatus);
      setSummary(budgetSummary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const check = useCallback((amount: bigint) => {
    return checkBudget(amount);
  }, []);

  return {
    config,
    status,
    summary,
    check,
    isLoading,
    error,
    refresh,
  };
}

// ============================================================================
// useAlgorandActivity Hook
// ============================================================================

interface ActivityStats {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  todayCount: number;
}

interface UseAlgorandActivityReturn {
  activities: OnChainActivity[];
  stats: ActivityStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  log: (type: OnChainActivity['type'], description: string, metadata?: Record<string, unknown>) => OnChainActivity;
}

export function useAlgorandActivity(limit: number = 20): UseAlgorandActivityReturn {
  const [activities, setActivities] = useState<OnChainActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setIsLoading(true);
      
      const recentActivities = getRecentActivities(limit);
      const activityStats = getActivityStats();
      
      setActivities(recentActivities);
      setStats(activityStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const log = useCallback((
    type: OnChainActivity['type'],
    description: string,
    metadata?: Record<string, unknown>
  ): OnChainActivity => {
    const activity = logActivity(type, description, DEFAULT_NETWORK, metadata);
    refresh();
    return activity;
  }, [refresh]);

  return {
    activities,
    stats,
    isLoading,
    error,
    refresh,
    log,
  };
}

// ============================================================================
// useWorkloadClassifier Hook
// ============================================================================

interface UseWorkloadClassifierReturn {
  classify: (taskType: string, description: string, complexity?: 'low' | 'medium' | 'high') => {
    isHeavy: boolean;
    reason: string;
    estimatedCost: { amount: bigint; asset: string; description: string } | null;
  };
  estimateCost: (taskType: string, complexity: 'low' | 'medium' | 'high') => {
    amount: bigint;
    asset: string;
    description: string;
  };
}

export function useWorkloadClassifier(): UseWorkloadClassifierReturn {
  const classify = useCallback((
    taskType: string,
    description: string,
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const classification = classifyTask(taskType, description, complexity);
    
    if (classification.isHeavy) {
      const cost = estimateTaskCost(taskType, complexity);
      return {
        isHeavy: true,
        reason: classification.reason,
        estimatedCost: cost,
      };
    }
    
    return {
      isHeavy: false,
      reason: classification.reason,
      estimatedCost: null,
    };
  }, []);

  const estimateCost = useCallback((
    taskType: string,
    complexity: 'low' | 'medium' | 'high'
  ) => {
    return estimateTaskCost(taskType, complexity);
  }, []);

  return { classify, estimateCost };
}
