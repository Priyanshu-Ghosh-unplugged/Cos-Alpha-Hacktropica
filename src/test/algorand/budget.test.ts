/**
 * Algorand Budget Tests
 * 
 * Tests for budget management functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBudgetConfig,
  setBudgetConfig,
  getBudgetStatus,
  recordTransaction,
  checkBudget,
  resetDailyBudget,
  setDefaultBudget,
  setTestnetBudget,
  setMainnetBudget,
  clearBudgetCache,
} from '@/lib/algorand/budget';
import { DEFAULT_BUDGET_CONFIG } from '@/lib/algorand/config';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Algorand Budget', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearBudgetCache();
  });

  describe('getBudgetConfig', () => {
    it('should return default config when no config stored', () => {
      const config = getBudgetConfig();
      
      expect(config.dailyLimit).toBe(DEFAULT_BUDGET_CONFIG.dailyLimit);
      expect(config.perTaskLimit).toBe(DEFAULT_BUDGET_CONFIG.perTaskLimit);
      expect(config.asset).toBe('ALGO');
      expect(config.warningThreshold).toBe(DEFAULT_BUDGET_CONFIG.warningThreshold);
    });

    it('should return stored config', () => {
      const customConfig = {
        dailyLimit: BigInt(10000000), // 10 ALGO
        perTaskLimit: BigInt(2000000), // 2 ALGO
        asset: 'ALGO',
        warningThreshold: 75,
      };
      
      setBudgetConfig(customConfig);
      const config = getBudgetConfig();
      
      expect(config.dailyLimit).toBe(customConfig.dailyLimit);
      expect(config.perTaskLimit).toBe(customConfig.perTaskLimit);
      expect(config.warningThreshold).toBe(75);
    });
  });

  describe('setBudgetConfig', () => {
    it('should update config partially', () => {
      setBudgetConfig({ dailyLimit: BigInt(3000000) });
      
      const config = getBudgetConfig();
      expect(config.dailyLimit).toBe(BigInt(3000000));
      expect(config.perTaskLimit).toBe(DEFAULT_BUDGET_CONFIG.perTaskLimit); // Unchanged
    });

    it('should preserve asset type', () => {
      setBudgetConfig({ asset: 'USDC' });
      
      const config = getBudgetConfig();
      expect(config.asset).toBe('USDC');
    });
  });

  describe('budget presets', () => {
    it('should set testnet budget', () => {
      setTestnetBudget();
      const config = getBudgetConfig();
      
      expect(config.dailyLimit).toBe(BigInt(10000000)); // 10 ALGO
      expect(config.perTaskLimit).toBe(BigInt(2000000)); // 2 ALGO
      expect(config.warningThreshold).toBe(75);
    });

    it('should set mainnet budget', () => {
      setMainnetBudget();
      const config = getBudgetConfig();
      
      expect(config.dailyLimit).toBe(BigInt(2000000)); // 2 ALGO
      expect(config.perTaskLimit).toBe(BigInt(500000)); // 0.5 ALGO
      expect(config.warningThreshold).toBe(50);
    });

    it('should set default budget', () => {
      setDefaultBudget();
      const config = getBudgetConfig();
      
      expect(config.dailyLimit).toBe(DEFAULT_BUDGET_CONFIG.dailyLimit);
    });
  });

  describe('getBudgetStatus', () => {
    it('should return fresh status with full budget', () => {
      setDefaultBudget();
      const status = getBudgetStatus();
      
      expect(status.dailySpent).toBe(0n);
      expect(status.dailyRemaining).toBe(DEFAULT_BUDGET_CONFIG.dailyLimit);
      expect(status.transactionsToday).toBe(0);
    });
  });

  describe('recordTransaction', () => {
    it('should record transaction and update status', () => {
      setDefaultBudget();
      const amount = BigInt(100000); // 0.1 ALGO
      
      const result = recordTransaction(amount);
      expect(result).toBe(true);
      
      const status = getBudgetStatus();
      expect(status.dailySpent).toBe(amount);
      expect(status.dailyRemaining).toBe(DEFAULT_BUDGET_CONFIG.dailyLimit - amount);
      expect(status.transactionsToday).toBe(1);
    });

    it('should reject transaction exceeding per-task limit', () => {
      setBudgetConfig({ perTaskLimit: BigInt(100000) }); // 0.1 ALGO per task
      
      const result = recordTransaction(BigInt(200000)); // 0.2 ALGO
      expect(result).toBe(false);
    });

    it('should reject transaction exceeding daily limit', () => {
      setBudgetConfig({ dailyLimit: BigInt(100000) }); // 0.1 ALGO daily
      recordTransaction(BigInt(50000)); // 0.05 ALGO
      
      const result = recordTransaction(BigInt(60000)); // Would exceed
      expect(result).toBe(false);
    });

    it('should allow multiple transactions within budget', () => {
      setDefaultBudget();
      
      expect(recordTransaction(BigInt(1000000))).toBe(true); // 1 ALGO
      expect(recordTransaction(BigInt(1000000))).toBe(true); // 1 ALGO
      expect(recordTransaction(BigInt(1000000))).toBe(true); // 1 ALGO
      expect(recordTransaction(BigInt(1000000))).toBe(true); // 1 ALGO
      expect(recordTransaction(BigInt(1000000))).toBe(true); // 1 ALGO
      
      const status = getBudgetStatus();
      expect(status.transactionsToday).toBe(5);
      expect(status.dailySpent).toBe(BigInt(5000000)); // 5 ALGO
    });
  });

  describe('checkBudget', () => {
    it('should allow transaction within limits', () => {
      setDefaultBudget();
      
      const result = checkBudget(BigInt(1000000)); // 1 ALGO
      expect(result.allowed).toBe(true);
    });

    it('should reject transaction exceeding per-task limit', () => {
      setBudgetConfig({ perTaskLimit: BigInt(100000) });
      
      const result = checkBudget(BigInt(200000));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('per-task limit');
    });

    it('should reject transaction exceeding daily limit', () => {
      setBudgetConfig({ dailyLimit: BigInt(100000) });
      recordTransaction(BigInt(50000));
      
      const result = checkBudget(BigInt(60000));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('daily budget');
    });

    it('should provide warning near threshold', () => {
      setBudgetConfig({ 
        dailyLimit: BigInt(1000000),
        warningThreshold: 80 
      });
      recordTransaction(BigInt(850000)); // 85% of budget
      
      const result = checkBudget(BigInt(10000));
      expect(result.allowed).toBe(true);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('85.0%');
    });
  });

  describe('resetDailyBudget', () => {
    it('should reset daily spending', () => {
      setDefaultBudget();
      recordTransaction(BigInt(1000000));
      
      const status = resetDailyBudget();
      
      expect(status.dailySpent).toBe(0n);
      expect(status.dailyRemaining).toBe(DEFAULT_BUDGET_CONFIG.dailyLimit);
      expect(status.transactionsToday).toBe(0);
    });
  });
});
