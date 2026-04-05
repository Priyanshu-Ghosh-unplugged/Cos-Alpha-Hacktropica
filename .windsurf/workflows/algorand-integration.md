---
description: Algorand Integration Guide for Cos-alpha
---

# Algorand Integration Workflow

This workflow describes how to use the Algorand integration in Cos-alpha for payments and agentic operations.

## Overview

The Algorand integration provides:
- **Wallet Management**: Create, import, and manage Algorand wallets
- **Payments**: Send ALGO and ASA tokens
- **x402 Protocol**: Pay for heavy/expensive tasks
- **Budget Control**: Set spending limits and track usage
- **Activity Logging**: Track all on-chain operations

## Quick Start

### 1. Create a Wallet

```typescript
import { createWallet } from '@/lib/algorand';

// Create a new wallet (mnemonic shown once, save it securely)
const { wallet, mnemonic } = createWallet('My Wallet', 'testnet', false);
console.log('Address:', wallet.address);
console.log('Mnemonic:', mnemonic); // SAVE THIS!
```

### 2. Check Balance

```typescript
import { getWalletBalance } from '@/lib/algorand';

const balance = await getWalletBalance(wallet.id);
console.log('Balance:', balance?.algoBalanceFormatted);
```

### 3. Send Payment

```typescript
import { sendAlgoPayment } from '@/lib/algorand';

const result = await sendAlgoPayment(
  'RECIPIENT_ADDRESS',
  BigInt(1000000), // 1 ALGO in microAlgos
  wallet.id,
  'Payment note'
);

if (result.success) {
  console.log('Transaction ID:', result.txId);
}
```

## Workload Classification

The system classifies tasks as **Light** or **Heavy/Chargeable**:

### Light Tasks (No Payment Required)
- Local file operations
- Free API calls
- Simple computations
- UI updates

### Heavy Tasks (Payment Required)
- LLM API calls (GPT, Claude, etc.)
- GPU compute jobs
- Large data processing
- Smart contract operations
- Streaming payments

```typescript
import { classifyTask, estimateTaskCost } from '@/lib/algorand';

const classification = classifyTask('llm_call', 'Generate text with GPT-4', 'medium');

if (classification.isHeavy) {
  const cost = estimateTaskCost('llm_call', 'medium');
  console.log(`Estimated cost: ${cost.amount} microALGO`);
}
```

## x402 Payment Flow

For heavy tasks, use the x402 protocol:

```typescript
import { createHeavyTaskRequest, payForHeavyTask } from '@/lib/algorand';

// 1. Create task request
const task = createHeavyTaskRequest(
  'llm_call',
  'Generate summary with GPT-4',
  ['llm', 'api'],
  BigInt(500000) // base cost
);

// 2. Get user confirmation (show cost)
console.log(`Cost: ${task.estimatedCost.amount} microALGO`);

// 3. Execute payment
const result = await payForHeavyTask(task.taskId, wallet.id);

if (result.success) {
  console.log('Payment confirmed:', result.paymentTxId);
  // Proceed with heavy task
}
```

## Budget Management

Set spending limits to control costs:

```typescript
import { setBudgetConfig, checkBudget, getBudgetSummary } from '@/lib/algorand';

// Set daily limit to 5 ALGO, per-task to 1 ALGO
setBudgetConfig({
  dailyLimit: BigInt(5000000),
  perTaskLimit: BigInt(1000000),
  warningThreshold: 80, // Warn at 80% usage
});

// Check before transaction
const check = checkBudget(BigInt(1000000));
if (!check.allowed) {
  console.error('Budget exceeded:', check.reason);
}

// View current status
const summary = getBudgetSummary();
console.log(`Spent today: ${summary.dailySpent}`);
console.log(`Remaining: ${summary.dailyRemaining}`);
```

## Using React Hooks

For React components, use the provided hooks:

```tsx
import { 
  useAlgorandWallets, 
  useAlgorandBalance, 
  useAlgorandPayment,
  useHeavyTask,
  useAlgorandBudget 
} from '@/hooks/useAlgorand';
import { AlgorandDashboard } from '@/components/algorand';

// Full dashboard
function MyPage() {
  return <AlgorandDashboard />;
}

// Individual features
function MyComponent() {
  const { wallets, activeWallet, create } = useAlgorandWallets();
  const { balance } = useAlgorandBalance(activeWallet?.id);
  const { send } = useAlgorandPayment();
  const { classify, pay } = useHeavyTask();
  const { summary } = useAlgorandBudget();
  
  // Use these in your UI
}
```

## UI Components

Use pre-built components:

```tsx
import { 
  AlgorandWalletManager,
  AlgorandBudgetDashboard,
  AlgorandActivityLog,
  AlgorandPaymentDialog,
  AlgorandDashboard 
} from '@/components/algorand';

// Full dashboard with tabs
<AlgorandDashboard />

// Individual components
<AlgorandWalletManager />
<AlgorandBudgetDashboard />
<AlgorandActivityLog />
<AlgorandPaymentDialog />
```

## Network Configuration

Supported networks:
- `testnet` - For development (recommended)
- `mainnet` - For production (use with caution)
- `betanet` - For beta features
- `localnet` - For local testing

```typescript
import { getNetworkConfig, isMainnet } from '@/lib/algorand';

const config = getNetworkConfig('testnet');
console.log('Algod server:', config.algodServer);

// Extra safety check for mainnet
if (isMainnet(network)) {
  // Show extra confirmation
}
```

## Safety Best Practices

1. **Always use Testnet first**: Test all operations on testnet before mainnet
2. **Set conservative budgets**: Start with lower limits
3. **Save mnemonics securely**: Never store in code or logs
4. **Review transactions**: Always confirm before sending
5. **Monitor activity**: Regularly check the activity log

## References

- [Algorand Developer Portal](https://dev.algorand.co)
- [AlgoKit Quick Start](https://dev.algorand.co/getting-started/algokit-quick-start/)
- [x402 Protocol](https://algorand.co/agentic-commerce/x402)
- [Algorand SDK Documentation](https://developer.algorand.org/docs/sdks/javascript/)
