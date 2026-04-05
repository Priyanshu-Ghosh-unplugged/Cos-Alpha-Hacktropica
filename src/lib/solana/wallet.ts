/**
 * Solana Wallet Management
 * 
 * Functions for creating, importing, and managing Solana wallets.
 */

import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import type { SolanaWallet, SolanaNetwork, SolanaBalance, SolanaAccountInfo } from './types';
import { STORAGE_KEYS, DEFAULT_NETWORK, getNetworkConfig, LAMPORTS_PER_SOL } from './config';

let walletsCache: SolanaWallet[] | null = null;
let activeWalletId: string | null = null;

function generateWalletId(): string {
  return `solana_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getWallets(): SolanaWallet[] {
  if (walletsCache) return walletsCache;
  
  const stored = localStorage.getItem(STORAGE_KEYS.wallets);
  if (stored) {
    walletsCache = JSON.parse(stored);
    return walletsCache || [];
  }
  return [];
}

function saveWallets(wallets: SolanaWallet[]): void {
  walletsCache = wallets;
  localStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
}

export function createWallet(
  name: string,
  network: SolanaNetwork = DEFAULT_NETWORK,
  storeSecret: boolean = false
): { wallet: SolanaWallet; secret: number[] } {
  const keypair = Keypair.generate();
  const secret = Array.from(keypair.secretKey);
  
  const wallet: SolanaWallet = {
    id: generateWalletId(),
    name: name.trim(),
    publicKey: keypair.publicKey.toString(),
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
  secret: number[],
  network: SolanaNetwork = DEFAULT_NETWORK,
  storeSecret: boolean = false
): SolanaWallet {
  try {
    const secretArray = new Uint8Array(secret);
    const keypair = Keypair.fromSecretKey(secretArray);
    
    const wallet: SolanaWallet = {
      id: generateWalletId(),
      name: name.trim(),
      publicKey: keypair.publicKey.toString(),
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

export function getAllWallets(): SolanaWallet[] {
  return getWallets();
}

export function getWalletById(id: string): SolanaWallet | null {
  const wallets = getWallets();
  return wallets.find(w => w.id === id) || null;
}

export function getWalletSecret(walletId: string): Uint8Array | null {
  const wallet = getWalletById(walletId);
  if (!wallet) return null;
  
  if (wallet.secretKey) {
    return new Uint8Array(wallet.secretKey);
  }
  
  return null;
}

export function getActiveWallet(): SolanaWallet | null {
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

export function updateWallet(walletId: string, updates: Partial<Omit<SolanaWallet, 'id'>>): boolean {
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
    new PublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}

export async function getBalance(publicKey: string, network?: SolanaNetwork): Promise<SolanaBalance | null> {
  const config = getNetworkConfig(network || DEFAULT_NETWORK);
  const connection = new Connection(config.rpcEndpoint, config.commitment);
  
  try {
    const pubkey = new PublicKey(publicKey);
    const lamports = await connection.getBalance(pubkey);
    
    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      pubkey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const tokens = tokenAccounts.value.map(account => {
      const data = account.account.data.parsed.info;
      return {
        mint: data.mint,
        amount: Number(data.tokenAmount.amount),
        decimals: data.tokenAmount.decimals,
        uiAmount: data.tokenAmount.uiAmount || 0,
      };
    });
    
    return {
      lamports,
      sol: lamports / LAMPORTS_PER_SOL,
      tokens,
    };
  } catch {
    return null;
  }
}

export async function getAccountInfo(publicKey: string, network?: SolanaNetwork): Promise<SolanaAccountInfo | null> {
  const config = getNetworkConfig(network || DEFAULT_NETWORK);
  const connection = new Connection(config.rpcEndpoint, config.commitment);
  
  try {
    const pubkey = new PublicKey(publicKey);
    const info = await connection.getAccountInfo(pubkey);
    
    if (!info) return null;
    
    return {
      address: publicKey,
      lamports: info.lamports,
      owner: info.owner.toString(),
      executable: info.executable,
      rentEpoch: info.rentEpoch,
      data: info.data,
    };
  } catch {
    return null;
  }
}

export function clearWalletsCache(): void {
  walletsCache = null;
  activeWalletId = null;
}
