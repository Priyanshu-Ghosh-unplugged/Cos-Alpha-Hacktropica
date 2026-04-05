/**
 * Algorand Wallet Tests
 * 
 * Tests for wallet management functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWallet,
  importWallet,
  getAllWallets,
  getWalletById,
  getActiveWallet,
  setActiveWallet,
  deleteWallet,
  isValidAddress,
  clearWalletsCache,
} from '@/lib/algorand/wallet';
import type { AlgorandWallet } from '@/lib/algorand/types';

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

describe('Algorand Wallet', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearWalletsCache();
  });

  describe('createWallet', () => {
    it('should create a new wallet with valid properties', () => {
      const { wallet, mnemonic } = createWallet('Test Wallet', 'testnet', false);
      
      expect(wallet).toBeDefined();
      expect(wallet.name).toBe('Test Wallet');
      expect(wallet.network).toBe('testnet');
      expect(wallet.address).toHaveLength(58); // Algorand address length
      expect(wallet.mnemonic).toBeUndefined(); // Not storing mnemonic
      expect(mnemonic).toBeDefined();
      expect(mnemonic.split(' ')).toHaveLength(25); // 25 words
    });

    it('should store mnemonic when requested', () => {
      const { wallet } = createWallet('Test Wallet', 'testnet', true);
      expect(wallet.mnemonic).toBeDefined();
    });

    it('should generate unique addresses', () => {
      const { wallet: w1 } = createWallet('Wallet 1', 'testnet', false);
      const { wallet: w2 } = createWallet('Wallet 2', 'testnet', false);
      
      expect(w1.address).not.toBe(w2.address);
    });
  });

  describe('importWallet', () => {
    it('should import a wallet from valid mnemonic', () => {
      const { mnemonic } = createWallet('Original', 'testnet', false);
      const imported = importWallet('Imported', mnemonic, 'testnet', false);
      
      expect(imported).toBeDefined();
      expect(imported.name).toBe('Imported');
      expect(imported.mnemonic).toBeUndefined();
    });

    it('should throw error for invalid mnemonic', () => {
      expect(() => {
        importWallet('Invalid', 'invalid mnemonic here', 'testnet', false);
      }).toThrow();
    });
  });

  describe('getAllWallets', () => {
    it('should return empty array when no wallets', () => {
      const wallets = getAllWallets();
      expect(wallets).toEqual([]);
    });

    it('should return all created wallets', () => {
      createWallet('Wallet 1', 'testnet', false);
      createWallet('Wallet 2', 'testnet', false);
      
      const wallets = getAllWallets();
      expect(wallets).toHaveLength(2);
    });
  });

  describe('setActiveWallet', () => {
    it('should set wallet as active', () => {
      const { wallet } = createWallet('Test', 'testnet', false);
      const result = setActiveWallet(wallet.id);
      
      expect(result).toBe(true);
      
      const active = getActiveWallet();
      expect(active?.id).toBe(wallet.id);
    });

    it('should return false for non-existent wallet', () => {
      const result = setActiveWallet('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('deleteWallet', () => {
    it('should delete existing wallet', () => {
      const { wallet } = createWallet('To Delete', 'testnet', false);
      const result = deleteWallet(wallet.id);
      
      expect(result).toBe(true);
      expect(getWalletById(wallet.id)).toBeNull();
    });

    it('should return false for non-existent wallet', () => {
      const result = deleteWallet('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid address', () => {
      const { wallet } = createWallet('Test', 'testnet', false);
      expect(isValidAddress(wallet.address)).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('too-short')).toBe(false);
    });
  });
});
