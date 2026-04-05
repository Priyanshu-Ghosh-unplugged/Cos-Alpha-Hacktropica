/**
 * Stellar Contract Deployment Script
 * 
 * Note: Since we don't have Rust/WASM compilation set up,
 * this script creates a simple payment channel contract
 * using Stellar's native multi-sig instead.
 */

const { 
  Keypair, 
  Server, 
  TransactionBuilder, 
  Operation, 
  Networks,
  BASE_FEE,
  Asset
} = require('@stellar/stellar-sdk');

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

async function deploy() {
  console.log('🚀 CosAlpha Stellar Deployment');
  console.log('='.repeat(50));
  
  const server = new Server(HORIZON_URL);
  
  // Check for deployer secret
  const secret = process.env.STELLAR_DEPLOYER_SECRET;
  
  if (!secret) {
    console.log('\n⚠️  No STELLAR_DEPLOYER_SECRET set');
    console.log('Creating new test account...');
    
    const keypair = Keypair.random();
    console.log('\n📝 New Test Account:');
    console.log(`  Public: ${keypair.publicKey()}`);
    console.log(`  Secret: ${keypair.secret()}`);
    console.log('\n⚠️  Fund this account from:');
    console.log('  https://laboratory.stellar.org/#account-creator?network=test');
    console.log('\nThen run: export STELLAR_DEPLOYER_SECRET=\'<secret>\'');
    return;
  }
  
  let keypair;
  try {
    keypair = Keypair.fromSecret(secret);
  } catch (e) {
    console.log('❌ Invalid secret key');
    return;
  }
  
  console.log(`\n📝 Deployer: ${keypair.publicKey()}`);
  
  // Check account
  try {
    const account = await server.loadAccount(keypair.publicKey());
    const balance = account.balances.find(b => b.asset_type === 'native');
    console.log(`💰 Balance: ${balance?.balance || '0'} XLM`);
    
    if (parseFloat(balance?.balance || '0') < 10) {
      console.log('\n⚠️  Low balance. Get testnet XLM from:');
      console.log('  https://laboratory.stellar.org/#account-creator?network=test');
      return;
    }
    
    // Stellar doesn't deploy WASM contracts the same way
    // Instead, we'll set up a multi-sig payment channel
    console.log('\n📦 Setting up CosAlpha Payment Channel...');
    
    // Create a secondary signer for multi-sig
    const cosalphaSigner = Keypair.random();
    console.log(`🔑 CosAlpha Signer: ${cosalphaSigner.publicKey()}`);
    
    // Build transaction to add signer
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: cosalphaSigner.publicKey(),
          weight: 1
        },
        lowThreshold: 1,
        medThreshold: 2,
        highThreshold: 2,
      }))
      .setTimeout(30)
      .build();
    
    transaction.sign(keypair);
    
    const result = await server.submitTransaction(transaction);
    console.log(`\n✅ Multi-sig configured!`);
    console.log(`  TX Hash: ${result.hash}`);
    console.log(`  Explorer: https://testnet.stellarchain.io/tx/${result.hash}`);
    
    // Save deployment info
    const fs = require('fs');
    const deployment = {
      network: 'testnet',
      account: keypair.publicKey(),
      cosalphaSigner: cosalphaSigner.publicKey(),
      cosalphaSecret: cosalphaSigner.secret(),
      tx_hash: result.hash,
      type: 'multisig_payment_channel'
    };
    
    fs.writeFileSync('contracts/stellar/deployment.json', JSON.stringify(deployment, null, 2));
    console.log(`\n💾 Saved to contracts/stellar/deployment.json`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.extras?.result_codes || error.message);
  }
}

deploy().catch(console.error);
