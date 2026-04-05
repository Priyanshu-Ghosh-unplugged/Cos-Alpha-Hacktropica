/**
 * Stellar Payments
 * 
 * Functions for sending payments and managing trustlines.
 */

import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  Memo,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import type {
  StellarNetwork,
  StellarAsset,
  PaymentRequest,
  PaymentResult,
  StellarAccountInfo,
} from './types';
import { getNetworkConfig, NATIVE_ASSET } from './config';
import { getWalletSecret } from './wallet';

export async function getBalance(
  publicKey: string,
  network?: StellarNetwork
): Promise<{ balance: string; asset: StellarAsset }[] | null> {
  const config = getNetworkConfig(network || 'testnet');
  const server = new Horizon.Server(config.horizonServer);
  
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map(b => {
      if (b.asset_type === 'native') {
        return { balance: b.balance, asset: NATIVE_ASSET };
      }
      return {
        balance: b.balance,
        asset: {
          code: (b as {asset_code: string}).asset_code,
          issuer: (b as {asset_issuer: string}).asset_issuer,
          type: b.asset_type as 'credit_alphanum4' | 'credit_alphanum12',
        },
      };
    });
  } catch {
    return null;
  }
}

export async function sendPayment(
  request: PaymentRequest,
  walletId: string,
  network?: StellarNetwork
): Promise<PaymentResult> {
  const secret = getWalletSecret(walletId);
  if (!secret) {
    return { success: false, error: 'Wallet not found or secret not available' };
  }
  
  try {
    const keypair = Keypair.fromSecret(secret);
    const config = getNetworkConfig(network || 'testnet');
    const server = new Horizon.Server(config.horizonServer);
    
    // Load source account
    const sourceAccount = await server.loadAccount(keypair.publicKey());
    
    // Build asset object
    const asset = request.asset.type === 'native'
      ? Asset.native()
      : new Asset(request.asset.code, request.asset.issuer!);
    
    // Build transaction
    let transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: config.passphrase,
    })
      .addOperation(Operation.payment({
        destination: request.destination,
        asset,
        amount: request.amount,
      }));
    
    // Add memo if provided
    if (request.memo && request.memoType) {
      switch (request.memoType) {
        case 'text':
          transaction = transaction.addMemo(Memo.text(request.memo));
          break;
        case 'id':
          transaction = transaction.addMemo(Memo.id(request.memo));
          break;
        case 'hash':
          transaction = transaction.addMemo(Memo.hash(request.memo));
          break;
        case 'return':
          transaction = transaction.addMemo(Memo.return(request.memo));
          break;
      }
    }
    
    const built = transaction.setTimeout(30).build();
    built.sign(keypair);
    
    const result = await server.submitTransaction(built);
    
    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

export async function changeTrust(
  asset: StellarAsset,
  limit: string,
  walletId: string,
  network?: StellarNetwork
): Promise<PaymentResult> {
  const secret = getWalletSecret(walletId);
  if (!secret) {
    return { success: false, error: 'Wallet not found or secret not available' };
  }
  
  if (asset.type === 'native') {
    return { success: false, error: 'Cannot create trustline for native asset' };
  }
  
  try {
    const keypair = Keypair.fromSecret(secret);
    const config = getNetworkConfig(network || 'testnet');
    const server = new Horizon.Server(config.horizonServer);
    
    const sourceAccount = await server.loadAccount(keypair.publicKey());
    
    const assetObj = new Asset(asset.code, asset.issuer!);
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: config.passphrase,
    })
      .addOperation(Operation.changeTrust({
        asset: assetObj,
        limit,
      }))
      .setTimeout(30)
      .build();
    
    transaction.sign(keypair);
    
    const result = await server.submitTransaction(transaction);
    
    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Trustline change failed',
    };
  }
}

export async function hasSufficientBalance(
  publicKey: string,
  amount: string,
  network?: StellarNetwork
): Promise<boolean> {
  const balances = await getBalance(publicKey, network);
  if (!balances) return false;
  
  const xlmBalance = balances.find(b => b.asset.type === 'native');
  if (!xlmBalance) return false;
  
  const required = Number(amount) + 0.5; // Add buffer for fees
  return Number(xlmBalance.balance) >= required;
}
