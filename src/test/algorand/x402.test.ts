/**
 * Algorand x402 Facilitator Tests
 * 
 * Tests for heavy task classification and x402 payment functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyTask,
  createHeavyTaskRequest,
  estimateTaskCost,
  getPendingTasks,
  cancelHeavyTask,
  clearPendingTasks,
} from '@/lib/algorand/x402';

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

describe('Algorand x402 Facilitator', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearPendingTasks();
  });

  describe('classifyTask', () => {
    it('should classify LLM tasks as heavy', () => {
      const result = classifyTask('llm_call', 'Call GPT-4 for text generation', 'medium');
      
      expect(result.isHeavy).toBe(true);
      expect(result.reason).toContain('llm_call');
    });

    it('should classify GPU tasks as heavy', () => {
      const result = classifyTask('gpu_job', 'Run image generation on GPU', 'medium');
      
      expect(result.isHeavy).toBe(true);
      expect(result.reason).toContain('gpu_job');
    });

    it('should classify contract operations as heavy', () => {
      const result = classifyTask('contract_deploy', 'Deploy new smart contract', 'medium');
      
      expect(result.isHeavy).toBe(true);
    });

    it('should classify simple tasks as light', () => {
      const result = classifyTask('simple_query', 'Basic local computation', 'low');
      
      expect(result.isHeavy).toBe(false);
    });

    it('should detect heavy keywords in description', () => {
      const result = classifyTask('custom', 'Make an API call to OpenAI', 'low');
      
      expect(result.isHeavy).toBe(true);
      expect(result.reason).toContain('api');
    });

    it('should classify high complexity tasks as heavy', () => {
      const result = classifyTask('data_process', 'Process large dataset', 'high');
      
      expect(result.isHeavy).toBe(true);
      expect(result.reason).toContain('High complexity');
    });
  });

  describe('estimateTaskCost', () => {
    it('should estimate LLM cost correctly', () => {
      const cost = estimateTaskCost('llm_call', 'medium');
      
      expect(cost.amount).toBeGreaterThan(0n);
      expect(cost.asset).toBe('ALGO');
      expect(cost.description).toContain('LLM');
    });

    it('should apply complexity multipliers', () => {
      const low = estimateTaskCost('llm_call', 'low');
      const medium = estimateTaskCost('llm_call', 'medium');
      const high = estimateTaskCost('llm_call', 'high');
      
      expect(low.amount).toBeLessThan(medium.amount);
      expect(medium.amount).toBeLessThan(high.amount);
    });

    it('should return default cost for unknown task types', () => {
      const cost = estimateTaskCost('unknown_task', 'low');
      
      expect(cost.amount).toBeGreaterThan(0n);
      expect(cost.description).toContain('General');
    });
  });

  describe('createHeavyTaskRequest', () => {
    it('should create task with correct structure', () => {
      const task = createHeavyTaskRequest(
        'llm_call',
        'Generate text with GPT-4',
        ['llm', 'api']
      );
      
      expect(task.taskId).toBeDefined();
      expect(task.taskType).toBe('llm_call');
      expect(task.description).toBe('Generate text with GPT-4');
      expect(task.estimatedCost.amount).toBeGreaterThan(0n);
      expect(task.estimatedCost.asset).toBe('ALGO');
      expect(task.deadline).toBeGreaterThan(Date.now());
    });

    it('should add resource costs', () => {
      const withGPU = createHeavyTaskRequest(
        'gpu_job',
        'Image generation',
        ['gpu'],
        BigInt(100000)
      );
      
      const withoutGPU = createHeavyTaskRequest(
        'simple_task',
        'Basic task',
        [],
        BigInt(100000)
      );
      
      expect(withGPU.estimatedCost.amount).toBeGreaterThan(withoutGPU.estimatedCost.amount);
    });

    it('should add duration costs', () => {
      const short = createHeavyTaskRequest(
        'streaming',
        'Short stream',
        [],
        BigInt(100000),
        60 // 1 minute
      );
      
      const long = createHeavyTaskRequest(
        'streaming',
        'Long stream',
        [],
        BigInt(100000),
        600 // 10 minutes
      );
      
      expect(long.estimatedCost.amount).toBeGreaterThan(short.estimatedCost.amount);
    });
  });

  describe('task lifecycle', () => {
    it('should track pending tasks', () => {
      const task = createHeavyTaskRequest('test', 'Test task', []);
      const pending = getPendingTasks();
      
      expect(pending).toHaveLength(1);
      expect(pending[0].taskId).toBe(task.taskId);
    });

    it('should cancel pending task', () => {
      const task = createHeavyTaskRequest('test', 'Test task', []);
      const result = cancelHeavyTask(task.taskId);
      
      expect(result).toBe(true);
      expect(getPendingTasks()).toHaveLength(0);
    });

    it('should return false when canceling non-existent task', () => {
      const result = cancelHeavyTask('non-existent');
      expect(result).toBe(false);
    });
  });
});
