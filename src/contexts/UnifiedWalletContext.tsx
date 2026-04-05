/**
 * Unified Wallet Context - Mock Authentication
 * 
 * Manages a unified wallet experience across Algorand, Stellar, and Solana.
 * Uses MOCK authentication for development/demo purposes.
 * 
 * Architecture:
 * - Algorand: Mock wallet generated from email hash
 * - Stellar: Derived from user email using deterministic key derivation
 * - Solana: Derived from user email using deterministic key derivation
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Keypair as StellarKeypair } from '@stellar/stellar-sdk';
import { Keypair as SolanaKeypair } from '@solana/web3.js';

export type Chain = 'algorand' | 'stellar' | 'solana';

export interface ChainWallet {
  address: string;
  publicKey: string;
  network: string;
  balance?: string;
}

export interface UnifiedWallet {
  isConnected: boolean;
  isLoading: boolean;
  user: {
    email: string;
    issuer: string;
    userId: string;
  } | null;
  wallets: {
    algorand: ChainWallet | null;
    stellar: ChainWallet | null;
    solana: ChainWallet | null;
  };
  error: string | null;
}

interface UnifiedWalletContextType extends UnifiedWallet {
  login: (method: 'email', credentials?: { email: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshWallets: () => Promise<void>;
  getWallet: (chain: Chain) => ChainWallet | null;
  isMockAuth: boolean;
}

const UnifiedWalletContext = createContext<UnifiedWalletContextType | undefined>(undefined);

// Simple hash function for deterministic wallet generation
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
};

// Derive Algorand wallet from email (mock)
const deriveAlgorandWallet = (email: string): ChainWallet => {
  const seed = hashString(email + '_algorand');
  const mockAddress = seed.substring(0, 58);
  
  return {
    address: mockAddress,
    publicKey: mockAddress,
    network: 'testnet',
  };
};

// Derive Stellar wallet from email (deterministic)
const deriveStellarWallet = (email: string): ChainWallet => {
  const seed = new TextEncoder().encode(email + '_stellar');
  const seedBytes = new Uint8Array(32);
  for (let i = 0; i < seed.length && i < 32; i++) {
    seedBytes[i] = seed[i];
  }
  
  const keypair = StellarKeypair.fromRawEd25519Seed(seedBytes as any);
  
  return {
    address: keypair.publicKey(),
    publicKey: keypair.publicKey(),
    network: 'testnet',
  };
};

// Derive Solana wallet from email (deterministic)
const deriveSolanaWallet = (email: string): ChainWallet => {
  const seed = new TextEncoder().encode(email + '_solana');
  const seedBytes = new Uint8Array(32);
  for (let i = 0; i < seed.length && i < 32; i++) {
    seedBytes[i] = seed[i];
  }
  
  const keypair = SolanaKeypair.fromSeed(seedBytes);
  
  return {
    address: keypair.publicKey.toString(),
    publicKey: keypair.publicKey.toString(),
    network: 'devnet',
  };
};

// Storage keys
const STORAGE_KEY = 'cosalpha_mock_wallet';

export function UnifiedWalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UnifiedWallet>({
    isConnected: false,
    isLoading: true,
    user: null,
    wallets: {
      algorand: null,
      stellar: null,
      solana: null,
    },
    error: null,
  });

  // Load saved wallet state on mount
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.isConnected && parsed.user) {
            setState(prev => ({
              ...prev,
              isConnected: true,
              user: parsed.user,
              wallets: parsed.wallets,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load wallet state:', error);
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadSavedState();
  }, []);

  // Save state when connected
  useEffect(() => {
    if (state.isConnected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isConnected: state.isConnected,
        user: state.user,
        wallets: state.wallets,
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.isConnected, state.user, state.wallets]);

  // Initialize wallets from email (mock)
  const initializeWallets = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Derive all wallets from email
      const algorandWallet = deriveAlgorandWallet(email);
      const stellarWallet = deriveStellarWallet(email);
      const solanaWallet = deriveSolanaWallet(email);

      // Generate issuer from email hash
      const issuer = `mock:${hashString(email).substring(0, 32)}`;

      setState({
        isConnected: true,
        isLoading: false,
        user: {
          email,
          issuer,
          userId: issuer.split(':').pop() || '',
        },
        wallets: {
          algorand: algorandWallet,
          stellar: stellarWallet,
          solana: solanaWallet,
        },
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Wallet initialization failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize wallets',
      }));
      return false;
    }
  }, []);

  // Mock login handler - no external API calls
  const login = useCallback(async (
    method: 'email',
    credentials?: { email: string }
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (method === 'email' && credentials?.email) {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock successful login
        return await initializeWallets(credentials.email);
      }

      throw new Error('Invalid login method or missing email');
    } catch (error) {
      console.error('Login failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      return false;
    }
  }, [initializeWallets]);

  // Logout handler
  const logout = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Clear all wallet state
      setState({
        isConnected: false,
        isLoading: false,
        user: null,
        wallets: {
          algorand: null,
          stellar: null,
          solana: null,
        },
        error: null,
      });
      
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Refresh wallet data
  const refreshWallets = useCallback(async () => {
    if (!state.isConnected || !state.user) return;
    await initializeWallets(state.user.email);
  }, [state.isConnected, state.user, initializeWallets]);

  // Get specific wallet
  const getWallet = useCallback((chain: Chain): ChainWallet | null => {
    return state.wallets[chain] || null;
  }, [state.wallets]);

  const value: UnifiedWalletContextType = {
    ...state,
    login,
    logout,
    refreshWallets,
    getWallet,
    isMockAuth: true,
  };

  return (
    <UnifiedWalletContext.Provider value={value}>
      {children}
    </UnifiedWalletContext.Provider>
  );
}

// Hook to use unified wallet
export function useUnifiedWallet(): UnifiedWalletContextType {
  const context = useContext(UnifiedWalletContext);
  if (context === undefined) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider');
  }
  return context;
}

// Hook to check if wallet is connected
export function useIsWalletConnected(): boolean {
  const context = useContext(UnifiedWalletContext);
  return context?.isConnected ?? false;
}

// Hook to get specific chain wallet
export function useChainWallet(chain: Chain): ChainWallet | null {
  const context = useContext(UnifiedWalletContext);
  return context?.wallets[chain] ?? null;
}
