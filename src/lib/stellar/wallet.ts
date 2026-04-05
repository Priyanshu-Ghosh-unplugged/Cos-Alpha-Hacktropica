/**
 * Stellar Wallet Management
 * 
 * Functions for creating, importing, and managing Stellar wallets.
 */

import { Keypair } from '@stellar/stellar-sdk';
import type { StellarWallet, StellarNetwork, StellarAccountInfo } from './types';
import { STORAGE_KEYS, DEFAULT_NETWORK, getNetworkConfig } from './config';

let walletsCache: StellarWallet[] | null = null;
let activeWalletId: string | null = null;

function generateWalletId(): string {
  return `stellar_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getWallets(): StellarWallet[] {
  if (walletsCache) return walletsCache;
  
  const stored = localStorage.getItem(STORAGE_KEYS.wallets);
  if (stored) {
    walletsCache = JSON.parse(stored);
    return walletsCache || [];
  }
  return [];
}

function saveWallets(wallets: StellarWallet[]): void {
  walletsCache = wallets;
  localStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
}

export function createWallet(
  name: string,
  network: StellarNetwork = DEFAULT_NETWORK,
  storeSecret: boolean = false
): { wallet: StellarWallet; secret: string } {
  const keypair = Keypair.random();
  const secret = keypair.secret();
  
  const wallet: StellarWallet = {
    id: generateWalletId(),
    name: name.trim(),
    publicKey: keypair.publicKey(),
    secretKey: storeSecret ? secret : undefined,
    isActive: false,
    network,
    createdAt: new Date().toISOString(),
  };
  
  const wallets = getWallets();
  wallets.push(wallet);
  saveWallets(wallets);
  
  return { wallet, secret };
}

export function importWallet(
  name: string,
  secret: string,
  network: StellarNetwork = DEFAULT_NETWORK,
  storeSecret: boolean = false
): StellarWallet {
  try {
    const keypair = Keypair.fromSecret(secret);
    
    const wallet: StellarWallet = {
      id: generateWalletId(),
      name: name.trim(),
      publicKey: keypair.publicKey(),
      secretKey: storeSecret ? secret : undefined,
      isActive: false,
      network,
      createdAt: new Date().toISOString(),
    };
    
    const wallets = getWallets();
    wallets.push(wallet);
    saveWallets(wallets);
    
    return wallet;
  } catch {
    throw new Error('Invalid secret key');
  }
}

export function getAllWallets(): StellarWallet[] {
  return getWallets();
}

export function getWalletById(id: string): StellarWallet | null {
  const wallets = getWallets();
  return wallets.find(w => w.id === id) || null;
}

export function getWalletSecret(walletId: string): string | null {
  const wallet = getWalletById(walletId);
  if (!wallet) return null;
  
  if (wallet.secretKey) {
    return wallet.secretKey;
  }
  
  return null;
}

export function getActiveWallet(): StellarWallet | null {
  if (activeWalletId) {
    const wallet = getWalletById(activeWalletId);
    if (wallet) return wallet;
  }
  
  const stored = localStorage.getItem(STORAGE_KEYS.activeWallet);
  if (stored) {
    const wallet = getWalletById(stored);
    if (wallet) {
      activeWalletId = stored;
      return wallet;
    }
  }
  
  const wallets = getWallets();
  const active = wallets.find(w => w.isActive);
  if (active) {
    activeWalletId = active.id;
    return active;
  }
  
  return null;
}

export function setActiveWallet(walletId: string): boolean {
  const wallets = getWallets();
  const wallet = wallets.find(w => w.id === walletId);
  
  if (!wallet) return false;
  
  wallets.forEach(w => w.isActive = false);
  wallet.isActive = true;
  
  activeWalletId = walletId;
  saveWallets(wallets);
  localStorage.setItem(STORAGE_KEYS.activeWallet, walletId);
  
  return true;
}

export function updateWallet(walletId: string, updates: Partial<Omit<StellarWallet, 'id'>>): boolean {
  const wallets = getWallets();
  const wallet = wallets.find(w => w.id === walletId);
  
  if (!wallet) return false;
  
  Object.assign(wallet, updates);
  saveWallets(wallets);
  
  return true;
}

export function deleteWallet(walletId: string): boolean {
  const wallets = getWallets();
  const index = wallets.findIndex(w => w.id === walletId);
  
  if (index === -1) return false;
  
  wallets.splice(index, 1);
  saveWallets(wallets);
  
  if (activeWalletId === walletId) {
    activeWalletId = null;
    localStorage.removeItem(STORAGE_KEYS.activeWallet);
  }
  
  return true;
}

export function isValidPublicKey(publicKey: string): boolean {
  try {
    Keypair.fromPublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}

export async function getAccountInfo(publicKey: string, network?: StellarNetwork): Promise<StellarAccountInfo | null> {
  const { Horizon } = await import('@stellar/stellar-sdk');
  const config = getNetworkConfig(network || DEFAULT_NETWORK);
  const server = new Horizon.Server(config.horizonServer);
  
  try {
    const account = await server.loadAccount(publicKey);
    
    return {
      id: account.id,
      sequence: account.sequence,
      balances: account.balances.map(b => {
        if (b.asset_type === 'native') {
          return {
            asset: { code: 'XLM', type: 'native' },
            balance: b.balance,
            buyingLiabilities: b.buying_liabilities,
            sellingLiabilities: b.selling_liabilities,
          };
        } else if (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12') {
          return {
            asset: { 
              code: (b as {asset_code: string}).asset_code, 
              issuer: (b as {asset_issuer: string}).asset_issuer,
              type: b.asset_type
            },
            balance: b.balance,
            limit: (b as {limit: string}).limit,
            buyingLiabilities: b.buying_liabilities,
            sellingLiabilities: b.selling_liabilities,
          };
        }
        // Liquidity pool - skip or handle separately
        return {
          asset: { code: 'LP', type: 'native' },
          balance: b.balance,
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        };
      }),
      thresholds: {
        low: account.thresholds.low_threshold,
        medium: account.thresholds.med_threshold,
        high: account.thresholds.high_threshold,
      },
      signers: account.signers.map(s => ({
        key: s.key,
        weight: s.weight,
        type: s.type,
      })),
      subentryCount: account.subentry_count,
      lastModifiedLedger: account.last_modified_ledger,
    };
  } catch {
    return null;
  }
}

export function clearWalletsCache(): void {
  walletsCache = null;
  activeWalletId = null;
}
