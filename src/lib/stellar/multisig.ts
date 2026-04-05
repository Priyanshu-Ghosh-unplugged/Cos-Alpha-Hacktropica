/**
 * Stellar Multi-Signature Module
 * 
 * Functions for setting up and managing multi-signature accounts.
 */

import {
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import type {
  StellarNetwork,
  MultisigConfig,
  PaymentResult,
} from './types';
import { getNetworkConfig } from './config';
import { getWalletSecret } from './wallet';

export async function createMultisigAccount(
  config: MultisigConfig,
  sourceWalletId: string,
  network?: StellarNetwork
): Promise<PaymentResult> {
  const secret = getWalletSecret(sourceWalletId);
  if (!secret) {
    return { success: false, error: 'Source wallet not found or secret not available' };
  }
  
  try {
    const keypair = Keypair.fromSecret(secret);
    const netConfig = getNetworkConfig(network || 'testnet');
    const server = new Horizon.Server(netConfig.horizonServer);
    
    const sourceAccount = await server.loadAccount(keypair.publicKey());
    
    // Build transaction with set options for multisig
    let transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: netConfig.passphrase,
    });
    
    // Add signers
    for (const signer of config.signers) {
      transaction = transaction.addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: signer.publicKey,
          weight: signer.weight,
        },
      }));
    }
    
    // Set thresholds
    transaction = transaction.addOperation(Operation.setOptions({
      lowThreshold: config.thresholds.low,
      medThreshold: config.thresholds.medium,
      highThreshold: config.thresholds.high,
    }));
    
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
      error: error instanceof Error ? error.message : 'Multisig setup failed',
    };
  }
}

export async function addSigner(
  publicKey: string,
  weight: number,
  sourceWalletId: string,
  network?: StellarNetwork
): Promise<PaymentResult> {
  const secret = getWalletSecret(sourceWalletId);
  if (!secret) {
    return { success: false, error: 'Wallet not found or secret not available' };
  }
  
  try {
    const keypair = Keypair.fromSecret(secret);
    const netConfig = getNetworkConfig(network || 'testnet');
    const server = new Horizon.Server(netConfig.horizonServer);
    
    const sourceAccount = await server.loadAccount(keypair.publicKey());
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: netConfig.passphrase,
    })
      .addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: publicKey,
          weight,
        },
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
      error: error instanceof Error ? error.message : 'Failed to add signer',
    };
  }
}

export async function removeSigner(
  publicKey: string,
  sourceWalletId: string,
  network?: StellarNetwork
): Promise<PaymentResult> {
  const secret = getWalletSecret(sourceWalletId);
  if (!secret) {
    return { success: false, error: 'Wallet not found or secret not available' };
  }
  
  try {
    const keypair = Keypair.fromSecret(secret);
    const netConfig = getNetworkConfig(network || 'testnet');
    const server = new Horizon.Server(netConfig.horizonServer);
    
    const sourceAccount = await server.loadAccount(keypair.publicKey());
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: netConfig.passphrase,
    })
      .addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: publicKey,
          weight: 0, // Setting weight to 0 removes the signer
        },
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
      error: error instanceof Error ? error.message : 'Failed to remove signer',
    };
  }
}

export async function setThresholds(
  low: number,
  medium: number,
  high: number,
  sourceWalletId: string,
  network?: StellarNetwork
): Promise<PaymentResult> {
  const secret = getWalletSecret(sourceWalletId);
  if (!secret) {
    return { success: false, error: 'Wallet not found or secret not available' };
  }
  
  try {
    const keypair = Keypair.fromSecret(secret);
    const netConfig = getNetworkConfig(network || 'testnet');
    const server = new Horizon.Server(netConfig.horizonServer);
    
    const sourceAccount = await server.loadAccount(keypair.publicKey());
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: netConfig.passphrase,
    })
      .addOperation(Operation.setOptions({
        lowThreshold: low,
        medThreshold: medium,
        highThreshold: high,
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
      error: error instanceof Error ? error.message : 'Failed to set thresholds',
    };
  }
}
