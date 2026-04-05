/**
 * x402 Payment Facilitator Module
 * 
 * Implements the x402 protocol for agentic payments on Algorand.
 * Based on x402 specification from Algorand.
 * 
 * References:
 * - https://algorand.co/agentic-commerce/x402
 * - https://algorand.co/agentic-commerce/x402/developers
 */

import type { 
  X402PaymentRequirements, 
  X402PaymentProof, 
  HeavyTaskRequest, 
  HeavyTaskResult,
  PaymentResult,
  AlgorandNetwork 
} from './types';
import { ALGO_ASSET_ID, DEFAULT_NETWORK, X402_CONFIG, getCaip2ChainId, getNetworkConfig } from './config';
import { sendPayment, getWalletBalance } from './payments';
import { getActiveWallet, getWalletById } from './wallet';

// Store for pending heavy tasks
const pendingTasks = new Map<string, HeavyTaskRequest>();

/**
 * Classify if a task requires payment (Heavy/Chargeable)
 * 
 * Rules based on the integration plan:
 * - Light: Local operations, free APIs, small tasks
 * - Heavy: Paid APIs, LLM calls, large compute, on-chain operations
 */
export function classifyTask(
  taskType: string,
  description: string,
  estimatedComplexity: 'low' | 'medium' | 'high'
): { isHeavy: boolean; reason: string } {
  // Always heavy task types
  const alwaysHeavyTypes = [
    'llm_call',
    'gpu_job',
    'large_retrieval',
    'batch_process',
    'contract_deploy',
    'contract_interact',
    'streaming_payment',
  ];
  
  if (alwaysHeavyTypes.includes(taskType)) {
    return {
      isHeavy: true,
      reason: `Task type '${taskType}' requires external paid resources`,
    };
  }
  
  // High complexity tasks are heavy
  if (estimatedComplexity === 'high') {
    return {
      isHeavy: true,
      reason: 'High complexity task requires significant compute resources',
    };
  }
  
  // Keywords that indicate heavy tasks
  const heavyKeywords = [
    'llm', 'gpt', 'claude', 'gemini', 'ai model',
    'gpu', 'compute', 'training', 'inference',
    'blockchain', 'on-chain', 'deploy', 'contract',
    'paid', 'premium', 'api call', 'external service',
  ];
  
  const descLower = description.toLowerCase();
  for (const keyword of heavyKeywords) {
    if (descLower.includes(keyword)) {
      return {
        isHeavy: true,
        reason: `Task involves '${keyword}' which requires external resources`,
      };
    }
  }
  
  return {
    isHeavy: false,
    reason: 'Task can be performed locally without external resources',
  };
}

/**
 * Create a heavy task request with cost estimate
 */
export function createHeavyTaskRequest(
  taskType: string,
  description: string,
  requiredResources: string[],
  baseCostMicroAlgos: bigint = BigInt(100000), // 0.1 ALGO default
  duration?: number // in seconds, for streaming tasks
): HeavyTaskRequest {
  // Calculate estimated cost based on resources
  let estimatedCost = baseCostMicroAlgos;
  
  for (const resource of requiredResources) {
    const resourceLower = resource.toLowerCase();
    
    if (resourceLower.includes('llm') || resourceLower.includes('gpt')) {
      estimatedCost += BigInt(500000); // +0.5 ALGO
    } else if (resourceLower.includes('gpu')) {
      estimatedCost += BigInt(1000000); // +1 ALGO
    } else if (resourceLower.includes('storage')) {
      estimatedCost += BigInt(100000); // +0.1 ALGO
    } else if (resourceLower.includes('api')) {
      estimatedCost += BigInt(50000); // +0.05 ALGO
    }
  }
  
  // Duration multiplier for streaming
  if (duration && duration > 0) {
    const durationMinutes = Math.ceil(duration / 60);
    estimatedCost += BigInt(durationMinutes * 10000); // 0.01 ALGO per minute
  }
  
  const taskId = generateTaskId();
  const deadline = Date.now() + 3600000; // 1 hour deadline
  
  const request: HeavyTaskRequest = {
    taskId,
    taskType,
    description,
    estimatedCost: {
      amount: estimatedCost,
      asset: 'ALGO',
      usdEquivalent: Number(estimatedCost) / 1000000 * 0.25, // Approx 0.25 USD per ALGO
    },
    requiredResources,
    deadline,
  };
  
  pendingTasks.set(taskId, request);
  
  return request;
}

/**
 * Create x402 payment requirements for a heavy task
 */
export function createX402Requirements(
  taskRequest: HeavyTaskRequest,
  recipientAddress: string,
  network: AlgorandNetwork = DEFAULT_NETWORK
): X402PaymentRequirements {
  return {
    scheme: X402_CONFIG.scheme,
    network: getCaip2ChainId(network),
    requiredAmount: taskRequest.estimatedCost.amount,
    asset: taskRequest.estimatedCost.asset,
    recipientAddress,
    facilitatorUrl: X402_CONFIG.defaultFacilitatorUrl,
    deadline: taskRequest.deadline,
    metadata: {
      taskId: taskRequest.taskId,
      taskType: taskRequest.taskType,
      description: taskRequest.description,
    },
  };
}

/**
 * Execute payment for a heavy task
 */
export async function payForHeavyTask(
  taskId: string,
  walletId?: string,
  network?: AlgorandNetwork
): Promise<HeavyTaskResult> {
  const task = pendingTasks.get(taskId);
  
  if (!task) {
    return {
      taskId,
      success: false,
      error: 'Task not found or expired',
      timestamp: new Date().toISOString(),
    };
  }
  
  // Check if task is still valid
  if (Date.now() > task.deadline) {
    pendingTasks.delete(taskId);
    return {
      taskId,
      success: false,
      error: 'Task deadline expired',
      timestamp: new Date().toISOString(),
    };
  }
  
  const wallet = walletId ? getWalletById(walletId) : getActiveWallet();
  
  if (!wallet) {
    return {
      taskId,
      success: false,
      error: 'No wallet available',
      timestamp: new Date().toISOString(),
    };
  }
  
  const targetNetwork = network || wallet.network;
  
  // Check balance
  const balance = await getWalletBalance(wallet.id, targetNetwork);
  if (!balance || balance.algoBalance < task.estimatedCost.amount) {
    return {
      taskId,
      success: false,
      error: `Insufficient balance. Required: ${task.estimatedCost.amount.toString()} microALGO, Available: ${balance?.algoBalance.toString() || '0'} microALGO`,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Get recipient address (in real implementation, this would be the service provider)
  // For now, we'll use a placeholder - in production this should be configured
  const recipientAddress = wallet.address; // Self-transfer for testing
  
  // Create and send payment
  const paymentResult = await sendPayment({
    fromWalletId: wallet.id,
    toAddress: recipientAddress,
    amount: task.estimatedCost.amount,
    assetId: ALGO_ASSET_ID,
    note: `x402 payment for task ${taskId}: ${task.description}`,
  }, targetNetwork);
  
  if (!paymentResult.success) {
    return {
      taskId,
      success: false,
      error: `Payment failed: ${paymentResult.error}`,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Create payment proof
  const paymentProof: X402PaymentProof = {
    transactionId: paymentResult.txId,
    network: getCaip2ChainId(targetNetwork),
    amount: task.estimatedCost.amount,
    asset: task.estimatedCost.asset,
    recipient: recipientAddress,
    timestamp: Date.now(),
  };
  
  // Remove from pending
  pendingTasks.delete(taskId);
  
  return {
    taskId,
    success: true,
    paymentTxId: paymentResult.txId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verify x402 payment proof
 * 
 * This would verify the payment on-chain
 */
export async function verifyPaymentProof(
  proof: X402PaymentProof,
  network: AlgorandNetwork = DEFAULT_NETWORK
): Promise<boolean> {
  try {
    const config = getNetworkConfig(network);
    const client = new algosdk.Algodv2(
      config.algodToken,
      config.algodServer,
      config.algodPort
    );
    
    // Fetch transaction info
    const txInfo = await client.pendingTransactionInformation(proof.transactionId).do();
    
    // Verify transaction exists and matches proof
    if (!txInfo) {
      return false;
    }
    
    // Basic verification - in production, add more checks
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all pending heavy tasks
 */
export function getPendingTasks(): HeavyTaskRequest[] {
  const now = Date.now();
  const tasks: HeavyTaskRequest[] = [];
  
  for (const [taskId, task] of pendingTasks.entries()) {
    if (task.deadline > now) {
      tasks.push(task);
    } else {
      pendingTasks.delete(taskId);
    }
  }
  
  return tasks;
}

/**
 * Cancel a pending heavy task
 */
export function cancelHeavyTask(taskId: string): boolean {
  return pendingTasks.delete(taskId);
}

/**
 * Clear all pending tasks (for testing)
 */
export function clearPendingTasks(): void {
  pendingTasks.clear();
}

/**
 * Estimate cost for a task type
 */
export function estimateTaskCost(
  taskType: string,
  complexity: 'low' | 'medium' | 'high'
): { amount: bigint; asset: string; description: string } {
  const baseCosts: Record<string, bigint> = {
    llm_call: BigInt(500000),      // 0.5 ALGO
    gpu_job: BigInt(2000000),      // 2 ALGO
    storage: BigInt(100000),       // 0.1 ALGO
    api_call: BigInt(50000),       // 0.05 ALGO
    contract_deploy: BigInt(1000000), // 1 ALGO
    default: BigInt(100000),       // 0.1 ALGO
  };
  
  const complexityMultiplier: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 5,
  };
  
  const base = baseCosts[taskType] || baseCosts.default;
  const multiplier = complexityMultiplier[complexity];
  const amount = base * BigInt(multiplier);
  
  const descriptions: Record<string, string> = {
    llm_call: 'LLM API call',
    gpu_job: 'GPU compute job',
    storage: 'Data storage operation',
    api_call: 'External API call',
    contract_deploy: 'Smart contract deployment',
    default: 'General compute task',
  };
  
  return {
    amount,
    asset: 'ALGO',
    description: descriptions[taskType] || descriptions.default,
  };
}

// Private helpers

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Import algosdk for transaction verification
import algosdk from 'algosdk';
