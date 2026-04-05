/**
 * Algorand Balance & Payment Module
 * 
 * Implements balance checking and payment functionality.
 * Based on Algorand JavaScript SDK.
 * 
 * References:
 * - https://dev.algorand.co
 * - https://developer.algorand.org/docs/sdks/javascript/
 */

import algosdk from 'algosdk';
import type { AlgorandBalance, AlgorandAsset, PaymentRequest, PaymentResult, AlgorandNetwork } from './types';
import { ALGO_ASSET_ID, DEFAULT_NETWORK, getNetworkConfig, MIN_TX_FEE } from './config';
import { getActiveWallet, getWalletById, getWalletSecretKey, getSuggestedParams } from './wallet';

/**
 * Get balance for an address
 */
export async function getBalance(
  address: string,
  network: AlgorandNetwork = DEFAULT_NETWORK
): Promise<AlgorandBalance> {
  const config = getNetworkConfig(network);
  const client = new algosdk.Algodv2(
    config.algodToken,
    config.algodServer,
    config.algodPort
  );
  
  const accountInfo = await client.accountInformation(address).do();
  
  // Parse ALGO balance
  const algoBalance = BigInt(accountInfo.amount || 0);
  
  // Parse assets
  const assets: AlgorandAsset[] = [];
  
  if (accountInfo.assets && Array.isArray(accountInfo.assets)) {
    for (const asset of accountInfo.assets) {
      if (asset['asset-id'] !== undefined) {
        // Fetch asset params to get name, unit-name, decimals
        let name = `Asset ${asset['asset-id']}`;
        let unitName = 'units';
        let decimals = 0;
        
        try {
          const assetInfo = await client.getAssetByID(asset['asset-id']).do();
          name = assetInfo.params?.name || name;
          unitName = assetInfo.params?.['unit-name'] || unitName;
          decimals = assetInfo.params?.decimals ?? 0;
        } catch {
          // If asset info fetch fails, use defaults
        }
        
        assets.push({
          id: asset['asset-id'],
          name,
          unitName,
          decimals,
          amount: BigInt(asset.amount || 0),
        });
      }
    }
  }
  
  // Add ALGO as asset 0
  assets.unshift({
    id: ALGO_ASSET_ID,
    name: 'Algorand',
    unitName: 'ALGO',
    decimals: 6,
    amount: algoBalance,
  });
  
  return {
    address,
    algoBalance,
    algoBalanceFormatted: formatAlgoBalance(algoBalance),
    assets,
    round: Number(accountInfo['round']) || 0,
  };
}

/**
 * Get balance for a wallet by ID
 */
export async function getWalletBalance(
  walletId?: string,
  network?: AlgorandNetwork
): Promise<AlgorandBalance | null> {
  const wallet = walletId ? getWalletById(walletId) : getActiveWallet();
  
  if (!wallet) {
    return null;
  }
  
  return await getBalance(wallet.address, network || wallet.network);
}

/**
 * Format ALGO balance for display
 */
export function formatAlgoBalance(microAlgos: bigint): string {
  const algo = Number(microAlgos) / 1000000;
  return algo.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }) + ' ALGO';
}

/**
 * Format asset amount based on decimals
 */
export function formatAssetAmount(amount: bigint, decimals: number, unitName: string): string {
  const divisor = Math.pow(10, decimals);
  const formatted = Number(amount) / divisor;
  return `${formatted.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 6),
  })} ${unitName}`;
}

/**
 * Send a payment (ALGO or ASA)
 */
export async function sendPayment(
  request: PaymentRequest,
  network?: AlgorandNetwork
): Promise<PaymentResult> {
  const wallet = request.fromWalletId 
    ? getWalletById(request.fromWalletId) 
    : getActiveWallet();
  
  if (!wallet) {
    return {
      txId: '',
      confirmedRound: 0,
      fromAddress: '',
      toAddress: request.toAddress,
      amount: request.amount,
      assetId: request.assetId || ALGO_ASSET_ID,
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Wallet not found',
    };
  }
  
  const targetNetwork = network || wallet.network;
  const secretKey = getWalletSecretKey(wallet.id);
  
  if (!secretKey) {
    return {
      txId: '',
      confirmedRound: 0,
      fromAddress: wallet.address,
      toAddress: request.toAddress,
      amount: request.amount,
      assetId: request.assetId || ALGO_ASSET_ID,
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Wallet mnemonic not stored - cannot sign transactions',
    };
  }
  
  try {
    const config = getNetworkConfig(targetNetwork);
    const client = new algosdk.Algodv2(
      config.algodToken,
      config.algodServer,
      config.algodPort
    );
    
    const suggestedParams = await getSuggestedParams(targetNetwork);
    
    let txn: algosdk.Transaction;
    
    if (!request.assetId || request.assetId === ALGO_ASSET_ID) {
      // ALGO payment
      txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: wallet.address,
        receiver: request.toAddress,
        amount: request.amount,
        suggestedParams,
        note: request.note ? new TextEncoder().encode(request.note) : undefined,
      });
    } else {
      // ASA transfer
      txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: wallet.address,
        receiver: request.toAddress,
        assetIndex: request.assetId,
        amount: request.amount,
        suggestedParams,
        note: request.note ? new TextEncoder().encode(request.note) : undefined,
      });
    }
    
    // Sign transaction
    const signedTxn = txn.signTxn(secretKey);
    
    // Send transaction
    const response = await client.sendRawTransaction(signedTxn).do();
    const txId = txn.txID();
    
    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(client, txId, 4);
    
    return {
      txId,
      confirmedRound: result['confirmed-round'] || 0,
      fromAddress: wallet.address,
      toAddress: request.toAddress,
      amount: request.amount,
      assetId: request.assetId || ALGO_ASSET_ID,
      timestamp: new Date().toISOString(),
      success: true,
    };
    
  } catch (error) {
    return {
      txId: '',
      confirmedRound: 0,
      fromAddress: wallet.address,
      toAddress: request.toAddress,
      amount: request.amount,
      assetId: request.assetId || ALGO_ASSET_ID,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send ALGO payment (convenience function)
 */
export async function sendAlgoPayment(
  toAddress: string,
  amount: bigint,
  walletId?: string,
  note?: string,
  network?: AlgorandNetwork
): Promise<PaymentResult> {
  return sendPayment({
    fromWalletId: walletId || '',
    toAddress,
    amount,
    note,
  }, network);
}

/**
 * Check if wallet has sufficient balance for transaction
 */
export async function hasSufficientBalance(
  walletId: string,
  amount: bigint,
  assetId: number = ALGO_ASSET_ID,
  includeFees: boolean = true
): Promise<boolean> {
  const balance = await getWalletBalance(walletId);
  
  if (!balance) {
    return false;
  }
  
  if (assetId === ALGO_ASSET_ID) {
    const required = includeFees ? amount + BigInt(MIN_TX_FEE) : amount;
    return balance.algoBalance >= required;
  } else {
    const asset = balance.assets.find(a => a.id === assetId);
    if (!asset) {
      return false;
    }
    // For ASA transfers, also need ALGO for fees
    const assetOk = asset.amount >= amount;
    const algoOk = balance.algoBalance >= BigInt(MIN_TX_FEE);
    return assetOk && algoOk;
  }
}

/**
 * Opt-in to an ASA
 */
export async function optInToAsset(
  assetId: number,
  walletId?: string,
  network?: AlgorandNetwork
): Promise<PaymentResult> {
  const wallet = walletId ? getWalletById(walletId) : getActiveWallet();
  
  if (!wallet) {
    return {
      txId: '',
      confirmedRound: 0,
      fromAddress: '',
      toAddress: '',
      amount: BigInt(0),
      assetId,
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Wallet not found',
    };
  }
  
  // Opt-in is a 0-amount transfer to self
  return sendPayment({
    fromWalletId: wallet.id,
    toAddress: wallet.address,
    amount: BigInt(0),
    assetId,
    note: 'Asset opt-in',
  }, network || wallet.network);
}
