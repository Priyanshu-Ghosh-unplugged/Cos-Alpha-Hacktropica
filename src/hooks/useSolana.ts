/**
 * Solana React Hooks
 * 
 * Custom hooks for Solana integration in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  SolanaWallet,
  SolanaNetwork,
  SolanaBalance,
  TransactionResult,
  MultisigConfig,
  DeFiStrategy,
  SecurityEvent,
} from '@/lib/solana/types';
import {
  createWallet,
  importWallet,
  getAllWallets,
  getActiveWallet,
  setActiveWallet,
  deleteWallet,
  getBalance,
} from '@/lib/solana/wallet';
import { transferSol, sendTransaction } from '@/lib/solana/transactions';
import {
  setupMultisig,
  logSecurityEvent,
  getSecurityEvents,
} from '@/lib/solana/multisig';

// Wallet Management Hook
export function useSolanaWallets() {
  const [wallets, setWallets] = useState<SolanaWallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<SolanaWallet | null>(null);

  useEffect(() => {
    setWallets(getAllWallets());
    setActiveWalletState(getActiveWallet());
  }, []);

  const refresh = useCallback(() => {
    setWallets(getAllWallets());
    setActiveWalletState(getActiveWallet());
  }, []);

  const create = useCallback((
    name: string,
    network: SolanaNetwork = 'devnet',
    storeSecret: boolean = false
  ) => {
    const result = createWallet(name, network, storeSecret);
    refresh();
    return result;
  }, [refresh]);

  const importW = useCallback((
    name: string,
    secret: number[],
    network: SolanaNetwork = 'devnet',
    storeSecret: boolean = false
  ) => {
    const result = importWallet(name, secret, network, storeSecret);
    refresh();
    return result;
  }, [refresh]);

  const activateWallet = useCallback((walletId: string) => {
    const result = setActiveWallet(walletId);
    if (result) refresh();
    return result;
  }, [refresh]);

  const remove = useCallback((walletId: string) => {
    const result = deleteWallet(walletId);
    if (result) refresh();
    return result;
  }, [refresh]);

  return {
    wallets,
    activeWallet,
    create,
    import: importW,
    setActive: activateWallet,
    remove,
    refresh,
  };
}

// Balance Hook
export function useSolanaBalance(
  publicKey: string | undefined,
  network?: SolanaNetwork,
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
) {
  const [balance, setBalance] = useState<SolanaBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const bal = await getBalance(publicKey, network);
      setBalance(bal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, network]);

  useEffect(() => {
    fetchBalance();
    
    if (autoRefresh && publicKey) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, autoRefresh, publicKey, refreshInterval]);

  return { balance, isLoading, error, refresh: fetchBalance };
}

// Transaction Hook
export function useSolanaTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);

  const transfer = useCallback(async (
    to: string,
    amount: number, // in SOL
    walletId: string,
    network?: SolanaNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const txResult = await transferSol(to, amount, walletId, network);
      setResult(txResult);
      return txResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { transfer, isLoading, error, result };
}

// Multisig Hook
export function useSolanaMultisig() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMultisig = useCallback(async (
    config: MultisigConfig,
    payerWalletId: string,
    network?: SolanaNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await setupMultisig(config, payerWalletId, network);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Multisig setup failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createMultisig,
    isLoading,
    error,
  };
}

// Security Events Hook
export function useSolanaSecurity() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    setEvents(getSecurityEvents());
  }, []);

  const logEvent = useCallback((
    eventType: SecurityEvent['eventType'],
    metadata: Record<string, unknown>,
    walletId: string
  ) => {
    const event = logSecurityEvent(eventType, metadata, walletId);
    setEvents(getSecurityEvents());
    return event;
  }, []);

  const refresh = useCallback(() => {
    setEvents(getSecurityEvents());
  }, []);

  return { events, logEvent, refresh };
}
