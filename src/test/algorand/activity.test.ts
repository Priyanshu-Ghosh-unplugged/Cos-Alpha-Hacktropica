/**
 * Algorand Activity Logging Tests
 * 
 * Tests for activity logging functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  logActivity,
  logPaymentActivity,
  logHeavyTaskActivity,
  getAllActivities,
  getActivitiesByType,
  getActivitiesByStatus,
  getRecentActivities,
  getActivityById,
  updateActivityStatus,
  clearAllActivities,
  getActivityStats,
  formatActivity,
  clearActivityCache,
} from '@/lib/algorand/activity';
import type { PaymentResult, HeavyTaskResult } from '@/lib/algorand/types';

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

describe('Algorand Activity', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearActivityCache();
  });

  describe('logActivity', () => {
    it('should create activity with correct structure', () => {
      const activity = logActivity('payment', 'Test payment', 'testnet');
      
      expect(activity.id).toBeDefined();
      expect(activity.type).toBe('payment');
      expect(activity.description).toBe('Test payment');
      expect(activity.network).toBe('testnet');
      expect(activity.status).toBe('pending');
      expect(activity.timestamp).toBeDefined();
    });

    it('should store metadata', () => {
      const metadata = { txId: 'abc123', amount: '1000' };
      const activity = logActivity('payment', 'Test', 'testnet', metadata);
      
      expect(activity.metadata).toEqual(metadata);
    });

    it('should add to activity list', () => {
      logActivity('payment', 'Payment 1', 'testnet');
      logActivity('payment', 'Payment 2', 'testnet');
      
      const activities = getAllActivities();
      expect(activities).toHaveLength(2);
    });
  });

  describe('logPaymentActivity', () => {
    it('should log successful payment', () => {
      const payment: PaymentResult = {
        txId: 'test-tx-id',
        confirmedRound: 12345,
        fromAddress: 'FROM123',
        toAddress: 'TO456',
        amount: BigInt(1000000),
        assetId: 0,
        timestamp: new Date().toISOString(),
        success: true,
      };
      
      const activity = logPaymentActivity(payment, 'testnet');
      
      expect(activity.type).toBe('payment');
      expect(activity.status).toBe('confirmed');
      expect(activity.txId).toBe('test-tx-id');
      expect(activity.amount).toBe(BigInt(1000000));
    });

    it('should log failed payment', () => {
      const payment: PaymentResult = {
        txId: '',
        confirmedRound: 0,
        fromAddress: 'FROM123',
        toAddress: 'TO456',
        amount: BigInt(1000000),
        assetId: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Insufficient balance',
      };
      
      const activity = logPaymentActivity(payment, 'testnet');
      
      expect(activity.status).toBe('failed');
    });
  });

  describe('logHeavyTaskActivity', () => {
    it('should log successful task', () => {
      const result: HeavyTaskResult = {
        taskId: 'task-123',
        success: true,
        paymentTxId: 'pay-tx-456',
        timestamp: new Date().toISOString(),
      };
      
      const activity = logHeavyTaskActivity(result, 'testnet');
      
      expect(activity.type).toBe('heavy_task');
      expect(activity.status).toBe('confirmed');
      expect(activity.taskId).toBe('task-123');
      expect(activity.txId).toBe('pay-tx-456');
    });

    it('should log failed task', () => {
      const result: HeavyTaskResult = {
        taskId: 'task-123',
        success: false,
        error: 'Payment failed',
        timestamp: new Date().toISOString(),
      };
      
      const activity = logHeavyTaskActivity(result, 'testnet');
      
      expect(activity.status).toBe('failed');
    });
  });

  describe('getAllActivities', () => {
    it('should return empty array when no activities', () => {
      const activities = getAllActivities();
      expect(activities).toEqual([]);
    });

    it('should return activities in reverse chronological order', () => {
      const a1 = logActivity('payment', 'First', 'testnet');
      const a2 = logActivity('payment', 'Second', 'testnet');
      
      const activities = getAllActivities();
      expect(activities[0].id).toBe(a2.id); // Most recent first
      expect(activities[1].id).toBe(a1.id);
    });
  });

  describe('getActivitiesByType', () => {
    it('should filter by type', () => {
      logActivity('payment', 'Payment 1', 'testnet');
      logActivity('heavy_task', 'Task 1', 'testnet');
      logActivity('payment', 'Payment 2', 'testnet');
      
      const payments = getActivitiesByType('payment');
      expect(payments).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      logActivity('payment', 'Test', 'testnet');
      
      const contracts = getActivitiesByType('contract_interaction');
      expect(contracts).toHaveLength(0);
    });
  });

  describe('getActivitiesByStatus', () => {
    it('should filter by status', () => {
      const a1 = logActivity('payment', 'Test 1', 'testnet');
      updateActivityStatus(a1.id, 'confirmed');
      
      logActivity('payment', 'Test 2', 'testnet'); // pending
      
      const confirmed = getActivitiesByStatus('confirmed');
      expect(confirmed).toHaveLength(1);
    });
  });

  describe('getRecentActivities', () => {
    it('should return limited number of activities', () => {
      for (let i = 0; i < 10; i++) {
        logActivity('payment', `Payment ${i}`, 'testnet');
      }
      
      const recent = getRecentActivities(5);
      expect(recent).toHaveLength(5);
    });
  });

  describe('getActivityById', () => {
    it('should find activity by id', () => {
      const activity = logActivity('payment', 'Test', 'testnet');
      
      const found = getActivityById(activity.id);
      expect(found?.id).toBe(activity.id);
    });

    it('should return null for non-existent id', () => {
      const found = getActivityById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('updateActivityStatus', () => {
    it('should update status and txId', () => {
      const activity = logActivity('payment', 'Test', 'testnet');
      
      const result = updateActivityStatus(activity.id, 'confirmed', 'tx-123');
      expect(result).toBe(true);
      
      const updated = getActivityById(activity.id);
      expect(updated?.status).toBe('confirmed');
      expect(updated?.txId).toBe('tx-123');
    });

    it('should return false for non-existent activity', () => {
      const result = updateActivityStatus('non-existent', 'confirmed');
      expect(result).toBe(false);
    });
  });

  describe('clearAllActivities', () => {
    it('should remove all activities', () => {
      logActivity('payment', 'Test 1', 'testnet');
      logActivity('payment', 'Test 2', 'testnet');
      
      clearAllActivities();
      
      const activities = getAllActivities();
      expect(activities).toHaveLength(0);
    });
  });

  describe('getActivityStats', () => {
    it('should calculate correct statistics', () => {
      // Create activities with different statuses
      const a1 = logActivity('payment', 'Test 1', 'testnet');
      updateActivityStatus(a1.id, 'confirmed');
      
      const a2 = logActivity('payment', 'Test 2', 'testnet');
      updateActivityStatus(a2.id, 'confirmed');
      
      const a3 = logActivity('payment', 'Test 3', 'testnet'); // pending
      
      const a4 = logActivity('heavy_task', 'Task 1', 'testnet');
      updateActivityStatus(a4.id, 'failed');
      
      const stats = getActivityStats();
      
      expect(stats.total).toBe(4);
      expect(stats.confirmed).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.byType['payment']).toBe(3);
      expect(stats.byType['heavy_task']).toBe(1);
    });
  });

  describe('formatActivity', () => {
    it('should format activity for display', () => {
      const activity = logActivity('payment', 'Test payment', 'testnet', { amount: '1000000' });
      
      const formatted = formatActivity(activity);
      
      expect(formatted.id).toBe(activity.id);
      expect(formatted.type).toBe('payment');
      expect(formatted.description).toBe('Test payment');
      expect(formatted.status).toBe('pending');
      expect(formatted.network).toBe('testnet');
    });
  });
});
