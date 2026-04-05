# Contract Deployment Guide

This guide walks through deploying the CosAlpha smart contracts to Algorand, Stellar, and Solana testnets.

## Overview

| Chain | Contract Type | Network | Status |
|-------|--------------|---------|--------|
| Algorand | TEAL Escrow | Testnet | **DEPLOYED** ✓ |
| Stellar | Multi-sig Payment Channel | Testnet | Pending funding |
| Solana | Governance Setup | Devnet | New account needed |

## ✅ Algorand DEPLOYED

**App ID**: `758268177`  
**Explorer**: https://allo.info/application/758268177  
**Deployer**: `JO72MAFP7SB2HRQ5ZODJ3K4SSYAVN5ATVRH5TEN7CGDTRST54BACDR2VFU`

Status: **Successfully deployed to testnet!**

---

## ⏳ Stellar (Needs Funding)

**Account**: `GCEN727MESMZTHD427HJ43ZJF2HJ3MH3MSF77DVTH454GYZ74JIWKJUC`  
**Secret**: `SAIQ3QX5AFYIXC5HY7ANFMR3EUI7OWDBHUXXQIPJJVDOY4IJRTMWY2OT`

Fund at: https://laboratory.stellar.org/#account-creator?network=test  
Then deploy with the secret above.

---

## ⏳ Solana (Faucet Rate Limited - Use NEW Account)

⚠️ **Original account rate limited by faucet** (max 2 requests/8hrs)

**NEW Account** (use this instead):
```
Public: CewwgW6XETctBCD485g7NkzGhWNDURFRX26Ss4pY8oAA
Secret: 48,140,43,70,59,213,150,183,215,148,73,133,180,157,126,89,160,82,30,76,150,41,31,74,51,151,196,235,117,9,189,255,173,41,43,141,22,205,42,166,98,176,22,34,169,17,221,238,83,215,156,246,241,239,68,177,118,68,231,119,192,120,241,179
```

Fund at: https://faucet.solana.com/  
Then deploy with the new secret above.

---

## Deployment Steps

### 1. Algorand

```bash
# Set the mnemonic
export DEPLOYER_MNEMONIC='sketch hat shiver tunnel erosion can spring sort false believe random farm garlic wink hybrid receive depth business ribbon luxury insane recipe fly ability master'

# Fund the account first at https://dispenser.testnet.aws.algodev.network/

# Deploy
python contracts/algorand/deploy.py
```

### 2. Solana

```bash
# Set the secret key
export SOLANA_DEPLOYER_SECRET='130,209,214,128,100,48,176,46,66,10,175,39,105,208,141,247,207,70,151,171,189,29,219,172,226,14,203,205,92,125,13,79,34,227,94,182,214,211,225,247,163,43,30,241,66,189,83,67,92,170,175,226,192,64,6,71,191,60,128,183,29,91,222,217'

# Fund the account first at https://faucet.solana.com/

# Deploy
node contracts/solana/deploy.cjs
```

### 3. Stellar

```bash
# Generate account and fund it
node contracts/stellar/deploy.cjs

# Set the secret
export STELLAR_DEPLOYER_SECRET='<secret from output>'

# Deploy
node contracts/stellar/deploy.cjs
```

## Contract Features

### Algorand (CosAlpha Escrow)
- Task escrow with fund locking
- Release to provider on completion
- Refund to client on cancellation
- ASA token support
- Application ID saved to `contracts/algorand/deployment.json`

### Stellar (Multi-sig Payment Channel)
- Multi-signature account setup
- Cross-border payments
- Multi-currency support (XLM, USD, EUR)
- Transaction hash saved to `contracts/stellar/deployment.json`

### Solana (Governance Setup)
- PDA creation for CosAlpha governance
- High-throughput transaction support
- Program-derived address setup
- Deployment info saved to `contracts/solana/deployment.json`

## Verification

After deployment, verify your contracts:

- **Algorand**: https://allo.info/application/{app_id} ✓ (Working)
- **Stellar**: https://testnet.stellarchain.io/tx/{tx_hash}
- **Solana**: https://explorer.solana.com/tx/{signature}?cluster=devnet

## Next Steps

1. Fund all test accounts from faucets
2. Run deployment scripts
3. Save deployment info to frontend config
4. Update app with deployed contract addresses
