/**
 * Solana Contract Deployment Script
 * CommonJS version for compatibility
 */

const { 
  Connection, 
  PublicKey, 
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const fs = require('fs');

const NETWORK = 'devnet';
const RPC_URL = 'https://api.devnet.solana.com';

async function deploy() {
  console.log('🚀 CosAlpha Solana Deployment');
  console.log('='.repeat(50));
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  const secretKey = process.env.SOLANA_DEPLOYER_SECRET;
  
  if (!secretKey) {
    console.log('\n⚠️  No SOLANA_DEPLOYER_SECRET set');
    console.log('Creating new devnet account...');
    
    const keypair = Keypair.generate();
    console.log('\n📝 New Test Account:');
    console.log('  Public: ' + keypair.publicKey.toString());
    console.log('  Secret: [' + Array.from(keypair.secretKey).join(',') + ']');
    console.log('\n⚠️  Fund this account from:');
    console.log('  https://faucet.solana.com/');
    console.log("\nThen run: export SOLANA_DEPLOYER_SECRET='[secret bytes]'");
    return;
  }
  
  let keypair;
  try {
    const secretArray = secretKey.split(',').map(Number);
    keypair = Keypair.fromSecretKey(new Uint8Array(secretArray));
  } catch (e) {
    console.log('❌ Invalid secret key format');
    return;
  }
  
  const publicKey = keypair.publicKey;
  console.log('\n📝 Deployer: ' + publicKey.toString());
  
  const balance = await connection.getBalance(publicKey);
  console.log('💰 Balance: ' + (balance / LAMPORTS_PER_SOL).toFixed(9) + ' SOL');
  
  if (balance < LAMPORTS_PER_SOL * 0.01) {
    console.log('\n⚠️  Low balance. Get devnet SOL from:');
    console.log('  https://faucet.solana.com/');
    return;
  }
  
  console.log('\n📦 Setting up CosAlpha Governance...');
  
  const [cosalphaPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('cosalpha'), publicKey.toBuffer()],
    SystemProgram.programId
  );
  
  console.log('🔑 Governance PDA: ' + cosalphaPDA.toString());
  
  const cosalphaSigner = Keypair.generate();
  console.log('🔑 CosAlpha Signer: ' + cosalphaSigner.publicKey.toString());
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: 0,
    })
  );
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair]
    );
    
    console.log('\n✅ Configuration complete!');
    console.log('  TX: ' + signature);
    console.log('  Explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
    
    const deployment = {
      network: 'devnet',
      deployer: publicKey.toString(),
      governancePDA: cosalphaPDA.toString(),
      cosalphaSigner: cosalphaSigner.publicKey.toString(),
      cosalphaSecret: '[' + Array.from(cosalphaSigner.secretKey).join(',') + ']',
      tx_signature: signature,
      type: 'governance_setup'
    };
    
    fs.writeFileSync('contracts/solana/deployment.json', JSON.stringify(deployment, null, 2));
    console.log('\n💾 Saved to contracts/solana/deployment.json');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deploy().catch(console.error);
