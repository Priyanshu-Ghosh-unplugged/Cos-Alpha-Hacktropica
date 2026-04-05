# SuperPlane Integration Guide for Cos-alpha

## Overview

This document outlines the complete integration of SuperPlane DevOps control plane with the Cos-alpha multi-chain platform. The integration provides automated workflow orchestration for smart contract deployment, security monitoring, payment processing, and governance across Algorand, Stellar, and Solana blockchains.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SuperPlane    │    │   Cos-alpha     │    │   Blockchains   │
│   Control Plane │◄──►│   Application   │◄──►│  (Algo/Star/Sol) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Workflows     │    │   Webhooks      │    │   Smart Contracts│
│   & Canvases    │    │   & APIs        │    │   & Escrows      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features Implemented

### 1. Multi-Chain Deployment Pipeline
- **Automated contract compilation** for all three chains
- **Testnet validation** before mainnet deployment
- **Multi-signature approval gates** for security
- **Coordinated releases** across chains

### 2. Real-Time Security Monitoring
- **Threat detection** using AI analysis
- **Automated incident response** with PagerDuty integration
- **Evidence collection** for forensic analysis
- **Stakeholder notifications** via multiple channels

### 3. Cross-Chain Payment Automation
- **Multi-currency support** with automatic conversion
- **Escrow management** across different chains
- **Security logging** on Solana for audit trails
- **Accounting integration** for financial tracking

### 4. Decentralized Governance
- **Proposal creation** and validation
- **Voting period management** with real-time monitoring
- **Automated execution** of approved proposals
- **Immutable governance records**

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Git
- Blockchain testnet accounts

### Installation

1. **Clone and setup**:
```bash
git clone https://github.com/Priyanshu-Ghosh-unplugged/Cos-alpha.git
cd Cos-alpha
npm install
```

2. **Configure environment**:
```bash
cp .env.superplane .env
# Edit .env with your API keys and private keys
```

3. **Start SuperPlane**:
```bash
# Windows
scripts\start-superplane.bat

# Linux/Mac
chmod +x scripts/start-superplane.sh
./scripts/start-superplane.sh
```

4. **Access the services**:
- SuperPlane UI: http://localhost:3001
- SuperPlane API: http://localhost:3000
- Cos-alpha App: http://localhost:5173
- Dashboard: http://localhost:5173/superplane

## Configuration

### Environment Variables

Key environment variables in `.env.superplane`:

```bash
# SuperPlane
SUPERPLANE_WEBHOOK_SECRET=your-secret-key
WEBHOOK_BASE_URL=http://localhost:8000/api/superplane

# Blockchain Nodes
ALGORAND_NODE_URL=https://testnet-api.algorand.cloud
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
SOLANA_RPC_URL=https://api.devnet.solana.com

# External Services
SLACK_WEBHOOK_URL=your-slack-webhook
PAGERDUTY_API_KEY=your-pagerduty-key
JIRA_API_TOKEN=your-jira-token
```

### Workflow Configuration

Workflows are defined in JSON files in `superplane-config/workflows/`:

- `deployment-pipeline.json` - Multi-chain deployment automation
- `security-monitoring.json` - Real-time security incident response
- `payment-automation.json` - Cross-chain payment processing
- `governance.json` - Decentralized governance workflows

## API Endpoints

### SuperPlane Webhook Endpoints

#### Deployment Webhook
```http
POST /api/superplane/deployments
Content-Type: application/json
X-Superplane-Signature: <signature>

{
  "repository": "Priyanshu-Ghosh-unplugged/Cos-alpha",
  "branch": "main",
  "commit_hash": "abc123",
  "contracts": {
    "algorand": "contracts/algorand/approval.teal",
    "stellar": "contracts/stellar/target/wasm32-unknown-unknown/release/cosalpha_payment.wasm",
    "solana": "contracts/solana/target/deploy/cosalpha_agentic.so"
  }
}
```

#### Security Alert Webhook
```http
POST /api/superplane/security
Content-Type: application/json
X-Superplane-Signature: <signature>

{
  "chain": "algorand",
  "contract_address": "123456789",
  "event_type": "unauthorized_access",
  "severity": "high",
  "details": {
    "amount": 1000000,
    "sender": "unknown_address"
  }
}
```

#### Payment Webhook
```http
POST /api/superplane/payments
Content-Type: application/json
X-Superplane-Signature: <signature>

{
  "task_id": "task_123",
  "amount": 100.50,
  "currency": "USD",
  "recipient": "ALICE_ADDRESS",
  "escrow_contract": "ESCROW_ADDRESS",
  "chain": "algorand"
}
```

### Component Execution Endpoint
```http
POST /api/superplane/components
Content-Type: application/json

{
  "component": "algorand-deploy",
  "params": {
    "contract_path": "contracts/algorand/approval.teal",
    "clear_program": "contracts/algorand/clear.teal"
  }
}
```

## Blockchain Components

### Available Components

| Component | Chain | Description |
|-----------|-------|-------------|
| `algorand-deploy` | Algorand | Deploy smart contracts to Algorand |
| `stellar-deploy` | Stellar | Deploy Soroban contracts to Stellar |
| `solana-deploy` | Solana | Deploy Anchor programs to Solana |
| `security-monitor` | All | Monitor for security events |
| `payment-processor` | All | Process cross-chain payments |

### Component Usage

Each component can be executed via the SuperPlane API or used in workflows:

```javascript
// Example: Deploy Algorand contract
const result = await fetch('/api/superplane/components', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    component: 'algorand-deploy',
    params: {
      contract_path: 'contracts/algorand/approval.teal'
    }
  })
});
```

## Security Considerations

### Webhook Security
- All webhooks are signed with HMAC-SHA256
- Signature validation is mandatory
- Configure `SUPERPLANE_WEBHOOK_SECRET` with a strong secret

### Private Key Management
- Private keys are stored in environment variables
- Use hardware security modules (HSM) in production
- Rotate keys regularly

### Access Control
- SuperPlane UI supports role-based access control
- API endpoints require authentication
- Network restrictions for sensitive operations

## Monitoring & Observability

### Metrics Available
- Workflow execution status
- Transaction processing times
- Security alert counts
- Payment processing volumes
- System health indicators

### Logging
- Structured JSON logging
- Log levels: error, warn, info, debug
- Integration with external logging services

### Dashboards
- Real-time workflow monitoring
- Security incident tracking
- Payment processing analytics
- System performance metrics

## Troubleshooting

### Common Issues

1. **Docker containers fail to start**
   - Check Docker is running
   - Verify port availability (3000, 3001, 27017, 6379)
   - Check environment variables

2. **Webhook signature validation fails**
   - Verify `SUPERPLANE_WEBHOOK_SECRET` matches
   - Check webhook payload format
   - Ensure timestamp is recent

3. **Blockchain transactions fail**
   - Check node connectivity
   - Verify account balances
   - Confirm private key format

### Debug Commands

```bash
# Check SuperPlane logs
docker-compose -f docker-compose.superplane.yml logs -f

# Test webhook endpoint
curl -X POST http://localhost:8000/api/superplane/deployments \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check blockchain connectivity
curl http://localhost:3000/api/health
```

## Production Deployment

### Scaling Considerations
- Use container orchestration (Kubernetes)
- Implement database clustering
- Configure load balancing
- Set up monitoring and alerting

### Security Hardening
- Enable HTTPS/TLS
- Configure firewall rules
- Implement rate limiting
- Use secrets management

### Backup & Recovery
- Regular database backups
- Workflow configuration backups
- Disaster recovery procedures
- Testing backup restoration

## Contributing

### Adding New Components
1. Create component class in `src/lib/superplane/blockchain-components.ts`
2. Implement required methods
3. Add to component registry
4. Update documentation

### Creating New Workflows
1. Design workflow in SuperPlane UI
2. Export as JSON
3. Add to `superplane-config/workflows/`
4. Test with webhook endpoints

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Test specific workflow
npm run test:workflow deployment-pipeline
```

## Support

### Documentation
- SuperPlane Docs: https://docs.superplane.com/
- Cos-alpha Wiki: https://github.com/Priyanshu-Ghosh-unplugged/Cos-alpha/wiki

### Community
- Discord: [Cos-alpha Discord]
- GitHub Issues: [Project Issues]

### Getting Help
1. Check this documentation
2. Review GitHub issues
3. Join community discussions
4. Contact support team

## License

This integration is licensed under the MIT License. See LICENSE file for details.
