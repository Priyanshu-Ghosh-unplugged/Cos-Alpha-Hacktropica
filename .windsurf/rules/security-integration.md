---
trigger: model_decision
---

# NLP Encryption Layer × Stellar × Solana Security Context

This context defines how Cos-alpha, NL agents, and tools must use **Stellar** and **Solana** to secure the NLP encryption layer.

## 1. Core Principles

- All sensitive NLP data (prompts, outputs, documents containing PII, secrets, or confidential info) MUST be encrypted at the **application layer** before storage or external transmission.
- Blockchains (Stellar and Solana) are used ONLY for:
  - Access control decisions.
  - Admin/governance controls.
  - Tamper-evident logging.
- Plaintext sensitive data MUST NEVER be written on-chain.

---

## 2. Stellar: Per-key Access Control

Stellar is the **access-control ledger** for encryption keys.

- For each encryption key (or key group), Cos-alpha maintains a corresponding **Stellar “Key Guardian” account** with:
  - Multi-signature configuration (weights + thresholds).
  - Signers representing different roles (user devices, security service, recovery, etc).

**Rule S1 – Decryption Authorization**

- Before decrypting any sensitive NLP data, the system MUST verify that:
  - A Stellar transaction or signed envelope exists that:
    - References the key ID and purpose (e.g., “NLP_DECRYPT:project=XYZ”).
    - Contains enough signatures to meet the configured threshold.
- If this Stellar authorization is missing or signatures are insufficient, decryption MUST be denied.

**Rule S2 – Role Separation**

- Different signers MUST be kept on different devices/services.
- At least two independent signers MUST be required for “high-risk” decryptions (e.g., large document dumps, bulk exports).

---

## 3. Solana: Admin / Governance and Audit

Solana is the **admin/governance and logging layer** for key management and security posture.

**Rule O1 – Admin Actions via Multisig**

- All high-privilege operations on the encryption layer MUST be gated by a Solana multisig or governance program, including:
  - Creating or destroying master keys.
  - Granting a new service access to decryption APIs.
  - Enabling or disabling decryption for a user or project.
- These actions MUST require m-of-n multisig approval by designated security/admin signers.

**Rule O2 – Tamper-Evident Event Log**

- The system SHOULD record key lifecycle events on Solana, such as:
  - KEY_CREATED, KEY_ROTATED, KEY_DISABLED, ACCESS_REVOKED.
- Logs MUST only contain:
  - Key IDs or pseudonyms.
  - Hashes of policies/metadata.
  - No plaintext user data.
- Agents MUST treat Solana as the source of truth for whether a key or service remains valid.

---

## 4. NLP Agent Behavior

**Rule A1 – Always Encrypt Sensitive Data**

- Agents MUST assume all user secrets, credentials, PII, or private documents are sensitive.
- Agents MUST NOT request raw keys; they only call higher-level “encrypt/decrypt” tools.

**Rule A2 – Decryption Requires Dual-Check**

- Before any decryption of sensitive text:
  1. Check Stellar access-policy state (S1).
  2. Check Solana admin/governance state (O1, O2).
- If either check fails, the tool MUST refuse and explain that security policy blocks decryption.

**Rule A3 – No On-chain Plaintext**

- Agents MUST NEVER:
  - Propose writing plaintext prompts or outputs to any blockchain.
  - Embed sensitive data in memos, program data, or transaction metadata.

---

## 5. Default Modes and Safety

- Default policy:
  - Decryption of sensitive NLP content requires at least:
    - 2-of-3 Stellar signers (e.g., user device + security service).
    - Solana multisig confirmation that the key and project are “ACTIVE”.
- Emergency mode:
  - If Solana governance marks a key or project as “DISABLED”, agents MUST refuse **all** decryptions for that scope, even if Stellar authorization exists.

---

## 6. Agent Prompt Summary

> - Treat all sensitive NLP data as encrypted-by-default.
> - Never handle raw keys; use encryption/decryption tools only.
> - Before decrypting, require:
>   - Stellar multi-signature authorization for that key and purpose.
>   - Solana multisig/governance confirmation that the key/service is active.
> - Never store or send plaintext sensitive data on Stellar, Solana, or any blockchain.
