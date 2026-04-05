/**
 * Stellar React Hooks
 * 
 * Custom hooks for Stellar integration in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  StellarWallet,
  StellarNetwork,
  StellarBalance,
  PaymentRequest,
  PaymentResult,
  MultisigConfig,
} from '@/lib/stellar/types';
import {
  createWallet,
  importWallet,
  getAllWallets,
  getActiveWallet,
  setActiveWallet,
  deleteWallet,
  getAccountInfo,
} from '@/lib/stellar/wallet';
import { sendPayment, getBalance, changeTrust } from '@/lib/stellar/payments';
import {
  createMultisigAccount,
  addSigner,
  removeSigner,
  setThresholds,
} from '@/lib/stellar/multisig';

// Wallet Management Hook
export function useStellarWallets() {
  const [wallets, setWallets] = useState<StellarWallet[]>([]);
  const [activeWallet, setActive] = useState<StellarWallet | null>(null);

  useEffect(() => {
    setWallets(getAllWallets());
    setActive(getActiveWallet());
  }, []);

  const refresh = useCallback(() => {
    setWallets(getAllWallets());
    setActive(getActiveWallet());
  }, []);

  const create = useCallback((
    name: string,
    network: StellarNetwork = 'testnet',
    storeSecret: boolean = false
  ) => {
    const result = createWallet(name, network, storeSecret);
    refresh();
    return result;
  }, [refresh]);

  const importW = useCallback((
    name: string,
    secret: string,
    network: StellarNetwork = 'testnet',
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
export function useStellarBalance(
  publicKey: string | undefined,
  network?: StellarNetwork,
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
) {
  const [balance, setBalance] = useState<StellarBalance[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const accountInfo = await getAccountInfo(publicKey, network);
      if (accountInfo) {
        setBalance(accountInfo.balances);
      } else {
        setBalance(null);
      }
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

// Payment Hook
export function useStellarPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const send = useCallback(async (
    request: PaymentRequest,
    walletId: string,
    network?: StellarNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const paymentResult = await sendPayment(request, walletId, network);
      setResult(paymentResult);
      return paymentResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trustline = useCallback(async (
    asset: { code: string; issuer: string },
    limit: string,
    walletId: string,
    network?: StellarNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await changeTrust(
        { code: asset.code, issuer: asset.issuer, type: 'credit_alphanum4' },
        limit,
        walletId,
        network
      );
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Trustline change failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { send, trustline, isLoading, error, result };
}

// Multisig Hook
export function useStellarMultisig() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupMultisig = useCallback(async (
    config: MultisigConfig,
    sourceWalletId: string,
    network?: StellarNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createMultisigAccount(config, sourceWalletId, network);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Multisig setup failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSignerKey = useCallback(async (
    publicKey: string,
    weight: number,
    sourceWalletId: string,
    network?: StellarNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await addSigner(publicKey, weight, sourceWalletId, network);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add signer';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeSignerKey = useCallback(async (
    publicKey: string,
    sourceWalletId: string,
    network?: StellarNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await removeSigner(publicKey, sourceWalletId, network);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove signer';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateThresholds = useCallback(async (
    low: number,
    medium: number,
    high: number,
    sourceWalletId: string,
    network?: StellarNetwork
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await setThresholds(low, medium, high, sourceWalletId, network);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update thresholds';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    setupMultisig,
    addSigner: addSignerKey,
    removeSigner: removeSignerKey,
    updateThresholds,
    isLoading,
    error,
  };
}
