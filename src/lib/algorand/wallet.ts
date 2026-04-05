/**
 * Algorand Wallet Management Module
 * 
 * Implements wallet creation, import, storage, and management.
 * Based on Algorand JavaScript SDK best practices.
 * 
 * References:
 * - https://dev.algorand.co
 * - https://developer.algorand.org/docs/sdks/javascript/
 */

import algosdk from 'algosdk';
import type { AlgorandWallet, AlgorandNetwork } from './types';
import { DEFAULT_NETWORK, STORAGE_KEYS, getNetworkConfig } from './config';

// In-memory wallet storage (replace with secure storage in production)
let walletsCache: AlgorandWallet[] | null = null;
let activeWalletId: string | null = null;

/**
 * Generate a new Algorand wallet
 */
export function createWallet(
  name: string,
  network: AlgorandNetwork = DEFAULT_NETWORK,
  storeMnemonic: boolean = false
): { wallet: AlgorandWallet; mnemonic: string } {
  // Generate account using algosdk
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  
  const wallet: AlgorandWallet = {
    id: generateWalletId(),
    name: name.trim(),
    address: account.addr.toString(),
    mnemonic: storeMnemonic ? mnemonic : undefined,
    isActive: false,
    network,
    createdAt: new Date().toISOString(),
  };
  
  // Save to storage
  saveWallet(wallet);
  
  return { wallet, mnemonic };
}

/**
 * Import an existing wallet from mnemonic
 */
export function importWallet(
  name: string,
  mnemonic: string,
  network: AlgorandNetwork = DEFAULT_NETWORK,
  storeMnemonic: boolean = false
): AlgorandWallet {
  // Validate mnemonic and get address
  const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
  
  const wallet: AlgorandWallet = {
    id: generateWalletId(),
    name: name.trim(),
    address: account.addr.toString(),
    mnemonic: storeMnemonic ? mnemonic.trim() : undefined,
    isActive: false,
    network,
    createdAt: new Date().toISOString(),
  };
  
  saveWallet(wallet);
  
  return wallet;
}

/**
 * Get secret key for a wallet (requires stored mnemonic)
 */
export function getWalletSecretKey(walletId: string): Uint8Array | null {
  const wallet = getWalletById(walletId);
  if (!wallet || !wallet.mnemonic) {
    return null;
  }
  
  try {
    const account = algosdk.mnemonicToSecretKey(wallet.mnemonic);
    return account.sk;
  } catch {
    return null;
  }
}

/**
 * Get all stored wallets
 */
export function getAllWallets(): AlgorandWallet[] {
  if (walletsCache === null) {
    const stored = localStorage.getItem(STORAGE_KEYS.wallets);
    walletsCache = stored ? JSON.parse(stored) : [];
  }
  return [...walletsCache];
}

/**
 * Get wallet by ID
 */
export function getWalletById(walletId: string): AlgorandWallet | null {
  const wallets = getAllWallets();
  return wallets.find(w => w.id === walletId) || null;
}

/**
 * Get wallet by address
 */
export function getWalletByAddress(address: string): AlgorandWallet | null {
  const wallets = getAllWallets();
  return wallets.find(w => w.address === address) || null;
}

/**
 * Get currently active wallet
 */
export function getActiveWallet(): AlgorandWallet | null {
  if (activeWalletId === null) {
    const stored = localStorage.getItem(STORAGE_KEYS.activeWallet);
    activeWalletId = stored || '';
  }
  
  if (!activeWalletId) {
    // Return first wallet if none is active
    const wallets = getAllWallets();
    if (wallets.length > 0) {
      setActiveWallet(wallets[0].id);
      return wallets[0];
    }
    return null;
  }
  
  return getWalletById(activeWalletId);
}

/**
 * Set active wallet
 */
export function setActiveWallet(walletId: string): boolean {
  const wallet = getWalletById(walletId);
  if (!wallet) {
    return false;
  }
  
  // Update all wallets to inactive
  const wallets = getAllWallets();
  wallets.forEach(w => {
    w.isActive = w.id === walletId;
  });
  
  saveWallets(wallets);
  activeWalletId = walletId;
  localStorage.setItem(STORAGE_KEYS.activeWallet, walletId);
  
  return true;
}

/**
 * Update wallet name
 */
export function updateWalletName(walletId: string, newName: string): boolean {
  const wallets = getAllWallets();
  const wallet = wallets.find(w => w.id === walletId);
  
  if (!wallet) {
    return false;
  }
  
  wallet.name = newName.trim();
  saveWallets(wallets);
  
  return true;
}

/**
 * Delete a wallet
 */
export function deleteWallet(walletId: string): boolean {
  let wallets = getAllWallets();
  const wallet = wallets.find(w => w.id === walletId);
  
  if (!wallet) {
    return false;
  }
  
  wallets = wallets.filter(w => w.id !== walletId);
  saveWallets(wallets);
  
  // Clear active wallet if it was the deleted one
  if (activeWalletId === walletId) {
    activeWalletId = null;
    localStorage.removeItem(STORAGE_KEYS.activeWallet);
    
    // Set new active wallet if available
    if (wallets.length > 0) {
      setActiveWallet(wallets[0].id);
    }
  }
  
  return true;
}

/**
 * Validate an Algorand address
 */
export function isValidAddress(address: string): boolean {
  return algosdk.isValidAddress(address);
}

/**
 * Get account info from the network
 */
export async function getAccountInfo(
  address: string,
  network: AlgorandNetwork = DEFAULT_NETWORK
): Promise<algosdk.modelsv2.Account> {
  const config = getNetworkConfig(network);
  const client = new algosdk.Algodv2(
    config.algodToken,
    config.algodServer,
    config.algodPort
  );
  
  return await client.accountInformation(address).do();
}

/**
 * Get suggested transaction parameters
 */
export async function getSuggestedParams(
  network: AlgorandNetwork = DEFAULT_NETWORK
): Promise<algosdk.SuggestedParams> {
  const config = getNetworkConfig(network);
  const client = new algosdk.Algodv2(
    config.algodToken,
    config.algodServer,
    config.algodPort
  );
  
  return await client.getTransactionParams().do();
}

// Private helper functions

function generateWalletId(): string {
  return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveWallet(wallet: AlgorandWallet): void {
  const wallets = getAllWallets();
  
  // Check if wallet already exists
  const existingIndex = wallets.findIndex(w => w.id === wallet.id);
  if (existingIndex >= 0) {
    wallets[existingIndex] = wallet;
  } else {
    wallets.push(wallet);
  }
  
  saveWallets(wallets);
}

function saveWallets(wallets: AlgorandWallet[]): void {
  walletsCache = wallets;
  localStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
}

/**
 * Clear wallets cache (for testing)
 */
export function clearWalletsCache(): void {
  walletsCache = null;
  activeWalletId = null;
}
