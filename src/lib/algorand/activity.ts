/**
 * On-Chain Activity Logging Module
 * 
 * Implements logging and observability for all Algorand operations.
 * Part of Phase 4: Safety, Budgets, and Observability
 */

import type { OnChainActivity, AlgorandNetwork, PaymentResult, HeavyTaskResult } from './types';
import { STORAGE_KEYS, DEFAULT_NETWORK } from './config';

// Maximum number of activities to store
const MAX_STORED_ACTIVITIES = 100;

// In-memory cache
let activityCache: OnChainActivity[] | null = null;

/**
 * Log a new activity
 */
export function logActivity(
  type: OnChainActivity['type'],
  description: string,
  network: AlgorandNetwork = DEFAULT_NETWORK,
  metadata?: Record<string, unknown>
): OnChainActivity {
  const activity: OnChainActivity = {
    id: generateActivityId(),
    type,
    description,
    network,
    status: 'pending',
    timestamp: new Date().toISOString(),
    metadata,
  };
  
  const activities = getAllActivities();
  activities.unshift(activity); // Add to beginning
  
  // Trim if too many
  if (activities.length > MAX_STORED_ACTIVITIES) {
    activities.splice(MAX_STORED_ACTIVITIES);
  }
  
  saveActivities(activities);
  
  return activity;
}

/**
 * Log a payment activity
 */
export function logPaymentActivity(
  result: PaymentResult,
  network: AlgorandNetwork = DEFAULT_NETWORK
): OnChainActivity {
  const activity = logActivity(
    'payment',
    `Payment: ${result.amount.toString()} microALGO to ${result.toAddress.slice(0, 8)}...`,
    network,
    {
      txId: result.txId,
      fromAddress: result.fromAddress,
      toAddress: result.toAddress,
      amount: result.amount.toString(),
      assetId: result.assetId,
      confirmedRound: result.confirmedRound,
    }
  );
  
  activity.txId = result.txId;
  activity.amount = result.amount;
  activity.asset = result.assetId === 0 ? 'ALGO' : `ASA-${result.assetId}`;
  activity.status = result.success ? 'confirmed' : 'failed';
  
  updateActivity(activity);
  
  return activity;
}

/**
 * Log a heavy task activity
 */
export function logHeavyTaskActivity(
  result: HeavyTaskResult,
  network: AlgorandNetwork = DEFAULT_NETWORK
): OnChainActivity {
  const activity = logActivity(
    'heavy_task',
    `Heavy Task: ${result.taskId}`,
    network,
    {
      taskId: result.taskId,
      executionTxId: result.executionTxId,
      result: result.result,
      error: result.error,
    }
  );
  
  activity.taskId = result.taskId;
  activity.txId = result.paymentTxId;
  activity.status = result.success ? 'confirmed' : 'failed';
  
  updateActivity(activity);
  
  return activity;
}

/**
 * Log contract interaction
 */
export function logContractInteraction(
  description: string,
  contractId: string,
  txId?: string,
  network: AlgorandNetwork = DEFAULT_NETWORK,
  metadata?: Record<string, unknown>
): OnChainActivity {
  const activity = logActivity(
    'contract_interaction',
    description,
    network,
    {
      contractId,
      ...metadata,
    }
  );
  
  activity.txId = txId;
  activity.status = txId ? 'confirmed' : 'pending';
  
  updateActivity(activity);
  
  return activity;
}

/**
 * Log budget update
 */
export function logBudgetUpdate(
  description: string,
  network: AlgorandNetwork = DEFAULT_NETWORK
): OnChainActivity {
  return logActivity(
    'budget_update',
    description,
    network
  );
}

/**
 * Get all activities
 */
export function getAllActivities(): OnChainActivity[] {
  if (activityCache === null) {
    const stored = localStorage.getItem(STORAGE_KEYS.activity);
    if (stored) {
      const parsed = JSON.parse(stored);
      activityCache = parsed.map((a: Record<string, unknown>) => ({
        ...a,
        amount: a.amount ? BigInt(a.amount as string) : undefined,
      }));
    } else {
      activityCache = [];
    }
  }
  return [...activityCache];
}

/**
 * Get activities by type
 */
export function getActivitiesByType(
  type: OnChainActivity['type']
): OnChainActivity[] {
  return getAllActivities().filter(a => a.type === type);
}

/**
 * Get activities by status
 */
export function getActivitiesByStatus(
  status: OnChainActivity['status']
): OnChainActivity[] {
  return getAllActivities().filter(a => a.status === status);
}

/**
 * Get recent activities (last N)
 */
export function getRecentActivities(limit: number = 10): OnChainActivity[] {
  return getAllActivities().slice(0, limit);
}

/**
 * Get activity by ID
 */
export function getActivityById(id: string): OnChainActivity | null {
  return getAllActivities().find(a => a.id === id) || null;
}

/**
 * Update an activity
 */
export function updateActivity(activity: OnChainActivity): boolean {
  const activities = getAllActivities();
  const index = activities.findIndex(a => a.id === activity.id);
  
  if (index === -1) {
    return false;
  }
  
  activities[index] = activity;
  saveActivities(activities);
  
  return true;
}

/**
 * Update activity status
 */
export function updateActivityStatus(
  id: string,
  status: OnChainActivity['status'],
  txId?: string
): boolean {
  const activity = getActivityById(id);
  if (!activity) {
    return false;
  }
  
  activity.status = status;
  if (txId) {
    activity.txId = txId;
  }
  activity.timestamp = new Date().toISOString();
  
  return updateActivity(activity);
}

/**
 * Clear all activities
 */
export function clearAllActivities(): void {
  activityCache = [];
  localStorage.removeItem(STORAGE_KEYS.activity);
}

/**
 * Get activity statistics
 */
export function getActivityStats(): {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  byType: Record<string, number>;
  todayCount: number;
} {
  const activities = getAllActivities();
  const today = new Date().toISOString().split('T')[0];
  
  const stats = {
    total: activities.length,
    pending: 0,
    confirmed: 0,
    failed: 0,
    byType: {} as Record<string, number>,
    todayCount: 0,
  };
  
  for (const activity of activities) {
    // Count by status
    if (activity.status === 'pending') stats.pending++;
    if (activity.status === 'confirmed') stats.confirmed++;
    if (activity.status === 'failed') stats.failed++;
    
    // Count by type
    stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
    
    // Count today's activities
    if (activity.timestamp.startsWith(today)) {
      stats.todayCount++;
    }
  }
  
  return stats;
}

/**
 * Get activities for a specific date range
 */
export function getActivitiesInRange(
  startDate: string,
  endDate: string
): OnChainActivity[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return getAllActivities().filter(a => {
    const activityTime = new Date(a.timestamp).getTime();
    return activityTime >= start && activityTime <= end;
  });
}

/**
 * Format activity for display
 */
export function formatActivity(activity: OnChainActivity): {
  id: string;
  type: string;
  description: string;
  status: string;
  timestamp: string;
  txId?: string;
  amount?: string;
  asset?: string;
  network: string;
} {
  return {
    id: activity.id,
    type: activity.type,
    description: activity.description,
    status: activity.status,
    timestamp: new Date(activity.timestamp).toLocaleString(),
    txId: activity.txId,
    amount: activity.amount ? formatMicroAlgo(activity.amount) : undefined,
    asset: activity.asset,
    network: activity.network,
  };
}

/**
 * Export activities to JSON
 */
export function exportActivities(): string {
  const activities = getAllActivities();
  return JSON.stringify(activities.map(a => ({
    ...a,
    amount: a.amount?.toString(),
  })), null, 2);
}

// Private helpers

function generateActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveActivities(activities: OnChainActivity[]): void {
  activityCache = activities;
  localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(
    activities.map(a => ({
      ...a,
      amount: a.amount?.toString(),
    }))
  ));
}

/**
 * Clear activity cache (for testing)
 */
export function clearActivityCache(): void {
  activityCache = null;
}

function formatMicroAlgo(microAlgos: bigint): string {
  const algo = Number(microAlgos) / 1000000;
  return `${algo.toFixed(6)} ALGO`;
}
