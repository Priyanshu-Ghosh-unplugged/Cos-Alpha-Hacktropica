# Multi-Chain Smart Contracts for Cos-alpha

This directory contains smart contracts for Algorand, Stellar, and Solana that enable agentic commerce, escrow payments, and governance.

## Overview

| Chain | Contract | Language | Purpose |
|-------|----------|----------|---------|
| **Algorand** | CosAlpha Escrow | PyTeal | Task escrow and release |
| **Stellar** | CosAlpha Payment | Rust/Soroban | Multi-currency payments with multisig |
| **Solana** | CosAlpha Agentic | Rust/Anchor | DeFi strategies, escrow, security logging |

---

## Algorand Contract

### File: `algorand/cosalpha_escrow.py`

**Features:**
- Task escrow creation
- Fund release to provider on completion
- Client refund on cancellation
- ASA (token) support

### Deploy

```bash
# Install dependencies
pip install pyteal algokit-utils

# Compile contract
python contracts/algorand/cosalpha_escrow.py

# Deploy with algokit
algokit deploy
```

### Interact

```javascript
import { ApplicationClient } from '@algorandfoundation/algokit-utils';

// Create escrow
await client.call({
  method: 'create',
  args: [taskId, clientAddr, providerAddr, amount]
});

// Complete task
await client.call({
  method: 'complete',
  args: []
});
```

---

## Stellar Contract

### File: `stellar/cosalpha_payment.rs`

**Features:**
- Multi-currency escrow (XLM, USD, EUR, etc.)
- Multi-signature task completion
- Cross-border payments
- Refund mechanism

### Deploy

```bash
# Install Soroban CLI
cargo install --locked soroban-cli

# Build contract
cd contracts/stellar
cargo build --target wasm32-unknown-unknown --release

# Deploy
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/cosalpha_payment.wasm --source <source>
```

### Interact

```javascript
import { Contract } from '@stellar/stellar-sdk';

const contract = new Contract(contractId);

// Create escrow
transaction.addOperation(contract.call(
  'create_escrow',
  taskId, client, provider, amount, asset, signers
));
```

---

## Solana Contract

### File: `solana/cosalpha_agentic.rs`

**Features:**
- High-throughput task escrow
- Multi-signature governance
- SPL token support
- Security event logging (immutable)
- DeFi strategy integration hooks

### Deploy

```bash
# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet
```

### Interact

```javascript
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';

// Initialize escrow
await program.methods
  .initializeEscrow(taskId, amount)
  .accounts({
    escrow,
    client,
    provider,
    tokenMint,
    // ...
  })
  .rpc();

// Sign completion
await program.methods
  .signCompletion()
  .accounts({ escrow, signer, admin })
  .rpc();
```

---

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Algorand   │    │   Stellar   │    │    Solana   │
│   (x402)    │    │  (FX/Remit) │    │   (DeFi)    │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ Task Escrow │    │ Multi-Curr  │    │ High-TPS    │
│ ASA Support │    │ Multi-Sig   │    │ Governance  │
│ Low Fees    │    │ Cross-Border│    │ Security    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                   ┌──────┴──────┐
                   │  Cos-alpha  │
                   │  Orchestrator│
                   └─────────────┘
```

---

## Security Considerations

1. **Multi-signature**: All contracts require multiple signatures for fund release
2. **Time locks**: Consider adding time-based release mechanisms
3. **Audit logs**: Solana contract logs all security events immutably
4. **Testnet first**: Always deploy to testnet before mainnet

## Testing

```bash
# Algorand
algokit test

# Stellar
soroban contract invoke --id <contract_id> --source <source> -- --help

# Solana
anchor test
```

## Resources

- [Algorand Developer Docs](https://dev.algorand.co)
- [Stellar Soroban Docs](https://developers.stellar.org/docs/build/smart-contracts)
- [Solana Anchor Docs](https://www.anchor-lang.com/)
