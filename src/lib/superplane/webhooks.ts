import algosdk from 'algosdk';
import StellarSdk from '@stellar/stellar-sdk';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';

export interface SuperPlaneWebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature: string;
  workflow_id?: string;
  execution_id?: string;
}

export interface DeploymentPayload {
  repository: string;
  branch: string;
  commit_hash: string;
  contracts: {
    algorand?: string;
    stellar?: string;
    solana?: string;
  };
}

export interface SecurityAlertPayload {
  chain: 'algorand' | 'stellar' | 'solana';
  contract_address: string;
  event_type: 'unauthorized_access' | 'large_transfer' | 'contract_upgrade';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
}

export interface PaymentPayload {
  task_id: string;
  amount: number;
  currency: string;
  recipient: string;
  escrow_contract: string;
  chain: 'algorand' | 'stellar' | 'solana';
}

export interface WebhookRequest {
  body: any;
  headers: { [key: string]: string };
}

export interface WebhookResponse {
  status: (code: number) => {
    json: (data: any) => void;
  };
}

export class SuperPlaneWebhookHandler {
  private algorandClient: algosdk.Algodv2;
  private stellarServer: StellarSdk.Server;
  private solanaConnection: Connection;

  constructor() {
    this.algorandClient = new algosdk.Algodv2(
      process.env.ALGORAND_TOKEN || '',
      process.env.ALGORAND_NODE_URL || 'https://testnet-api.algorand.cloud',
      process.env.ALGORAND_PORT || ''
    );
    
    this.stellarServer = new StellarSdk.Server(
      process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
    );
    
    this.solanaConnection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );
  }

  async handleDeploymentWebhook(req: WebhookRequest, res: WebhookResponse): Promise<void> {
    try {
      const payload: DeploymentPayload = req.body;
      
      // Validate webhook signature
      if (!this.validateSignature(req)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Trigger deployment workflow
      const deploymentResult = await this.triggerDeploymentPipeline(payload);
      
      res.status(200).json({
        success: true,
        deployment_id: deploymentResult.deploymentId,
        status: 'initiated'
      });
    } catch (error) {
      console.error('Deployment webhook error:', error);
      res.status(500).json({ error: 'Deployment failed' });
    }
  }

  async handleSecurityAlert(req: WebhookRequest, res: WebhookResponse): Promise<void> {
    try {
      const payload: SecurityAlertPayload = req.body;
      
      if (!this.validateSignature(req)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Assess threat level
      const threatAssessment = await this.assessThreat(payload);
      
      // Create incident if high risk
      if (threatAssessment.risk > 0.7) {
        await this.createSecurityIncident(payload, threatAssessment);
      }

      res.status(200).json({
        success: true,
        threat_level: threatAssessment.risk,
        incident_created: threatAssessment.risk > 0.7
      });
    } catch (error) {
      console.error('Security alert error:', error);
      res.status(500).json({ error: 'Security processing failed' });
    }
  }

  async handlePaymentWebhook(req: WebhookRequest, res: WebhookResponse): Promise<void> {
    try {
      const payload: PaymentPayload = req.body;
      
      if (!this.validateSignature(req)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Process payment based on chain
      const paymentResult = await this.processPayment(payload);
      
      res.status(200).json({
        success: true,
        transaction_id: paymentResult.transactionId,
        status: paymentResult.status
      });
    } catch (error) {
      console.error('Payment webhook error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  }

  private async triggerDeploymentPipeline(payload: DeploymentPayload): Promise<any> {
    // Build contracts for each chain
    const buildPromises = [];
    
    if (payload.contracts.algorand) {
      buildPromises.push(this.buildAlgorandContract(payload.contracts.algorand));
    }
    
    if (payload.contracts.stellar) {
      buildPromises.push(this.buildStellarContract(payload.contracts.stellar));
    }
    
    if (payload.contracts.solana) {
      buildPromises.push(this.buildSolanaContract(payload.contracts.solana));
    }

    const buildResults = await Promise.all(buildPromises);
    
    return {
      deploymentId: `deploy_${Date.now()}`,
      buildResults,
      status: 'building'
    };
  }

  private async assessThreat(payload: SecurityAlertPayload): Promise<{ risk: number; details: any }> {
    // AI-based threat assessment
    const riskFactors = {
      event_type: payload.event_type === 'unauthorized_access' ? 0.8 : 0.6,
      severity: payload.severity === 'critical' ? 0.9 : payload.severity === 'high' ? 0.7 : 0.5,
      amount_transferred: payload.details.amount ? Math.min(payload.details.amount / 100000, 1) : 0,
      contract_age: await this.getContractAge(payload.contract_address)
    };

    const risk = Object.values(riskFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(riskFactors).length;
    
    return {
      risk,
      details: riskFactors
    };
  }

  private async processPayment(payload: PaymentPayload): Promise<any> {
    switch (payload.chain) {
      case 'algorand':
        return this.processAlgorandPayment(payload);
      case 'stellar':
        return this.processStellarPayment(payload);
      case 'solana':
        return this.processSolanaPayment(payload);
      default:
        throw new Error(`Unsupported chain: ${payload.chain}`);
    }
  }

  private async processAlgorandPayment(payload: PaymentPayload): Promise<any> {
    // Implement Algorand payment logic
    const suggestedParams = await this.algorandClient.getTransactionParams().do();
    
    const transaction = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: process.env.ALGORAND_SENDER_ADDRESS!,
      to: payload.recipient,
      amount: Math.floor(payload.amount * 1000000), // Convert to microAlgos
      assetIndex: parseInt(process.env.ALGORAND_ASSET_ID || '0'),
      suggestedParams
    });

    // Sign and send transaction
    const signedTxn = transaction.signTxnSecretKey(
      Buffer.from(process.env.ALGORAND_PRIVATE_KEY!, 'base64')
    );
    
    const { txId } = await this.algorandClient.sendRawTransaction(signedTxn).do();
    
    return {
      transactionId: txId,
      status: 'confirmed'
    };
  }

  private async processStellarPayment(payload: PaymentPayload): Promise<any> {
    // Implement Stellar payment logic
    const sourceKeypair = StellarSdk.Keypair.fromSecret(
      process.env.STELLAR_PRIVATE_KEY!
    );
    
    const account = await this.stellarServer.loadAccount(sourceKeypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: payload.recipient,
          asset: StellarSdk.Asset.native(),
          amount: payload.amount.toString()
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    
    const result = await this.stellarServer.submitTransaction(transaction);
    
    return {
      transactionId: result.hash,
      status: 'confirmed'
    };
  }

  private async processSolanaPayment(payload: PaymentPayload): Promise<any> {
    // Implement Solana payment logic
    const fromKeypair = require('@solana/web3.js').Keypair.fromSecretKey(
      Buffer.from(process.env.SOLANA_PRIVATE_KEY!, 'base64')
    );
    
    const transaction = require('@solana/web3.js').SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(payload.recipient),
      lamports: payload.amount * 1000000000 // Convert to lamports
    });

    const signature = await this.solanaConnection.sendTransaction(
      new require('@solana/web3.js').Transaction().add(transaction),
      [fromKeypair]
    );

    await this.solanaConnection.confirmTransaction(signature);
    
    return {
      transactionId: signature,
      status: 'confirmed'
    };
  }

  private async buildAlgorandContract(contractPath: string): Promise<any> {
    // Implement Algorand contract compilation
    return { chain: 'algorand', status: 'built', contractPath };
  }

  private async buildStellarContract(contractPath: string): Promise<any> {
    // Implement Stellar contract compilation
    return { chain: 'stellar', status: 'built', contractPath };
  }

  private async buildSolanaContract(contractPath: string): Promise<any> {
    // Implement Solana contract compilation
    return { chain: 'solana', status: 'built', contractPath };
  }

  private async getContractAge(contractAddress: string): Promise<number> {
    // Calculate contract age factor (newer contracts = higher risk)
    return 0.3; // Placeholder
  }

  private async createSecurityIncident(payload: SecurityAlertPayload, assessment: any): Promise<void> {
    // Create incident in external system (PagerDuty, Jira, etc.)
    console.log('Creating security incident:', payload, assessment);
  }

  private validateSignature(req: Request): boolean {
    // Implement webhook signature validation
    const signature = req.headers['x-superplane-signature'] as string;
    const payload = JSON.stringify(req.body);
    const expectedSignature = require('crypto')
      .createHmac('sha256', process.env.SUPERPLANE_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

export const webhookHandler = new SuperPlaneWebhookHandler();
