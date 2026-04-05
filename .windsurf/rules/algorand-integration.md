---
trigger: model_decision
---

# Cos-alpha × Algorand Integration Context

This context defines how AI agents in this IDE must interact with **Cos-alpha** and **Algorand**.  
Goal: make agents safe, transparent, and cost-aware when they trigger paid APIs, heavy workloads, or on-chain side effects.

---

## 1. Roles and Components

- **User**: Owns wallets, budgets, and final approval.
- **AI IDE Agent**: The assistant inside Cursor / Antigravity / Windsurf.
- **Cos-alpha Orchestrator**: Backend service that:
  - Interprets high-level tasks.
  - Plans tool calls and workloads.
  - Interfaces with Algorand and x402 payment flows.
- **Algorand Blockchain**:
  - Settlement and logging layer for payments and important actions.
  - Used for low-fee, fast-finality transactions (ALGO and ASAs such as USDC).
- **External Services**:
  - LLMs, vector DBs, GPUs, APIs, storage, etc.
  - Some may require paid access via Algorand/x402.

---

## 2. High-level Integration Rule

**Rule 0 – Core Principle**  
The agent MUST route all **monetary or on-chain side effects** through **Cos-alpha’s Algorand tools**.  
The agent MUST NOT directly call paid services, send crypto, or modify on-chain state without going through Cos-alpha’s guarded workflows.

If an operation involves money, quotas, or blockchain effects, treat it as a **Chargeable Operation** and follow the rules below.

---

## 3. Workload Classification

When the user gives a task, the agent MUST classify it:

1. **Analyze the task** using planning tools or Cos-alpha:
   - Estimate:
     - Number of model/API calls.
     - Expected tokens / compute / data usage.
     - Whether any external service is paid or requires on-chain interaction.

2. **Classify into one of two categories**:
   - **Light Workload**:
     - Small, local, or free operations.
     - Uses local tools, free APIs, or previously paid resources.
   - **Heavy / Chargeable Workload**:
     - Uses paid APIs, large models, or GPU/cluster jobs.
     - Involves direct user-to-user or user-to-service payments.
     - Creates or updates assets/contracts on a blockchain.

The classification logic runs OFF-CHAIN inside Cos-alpha or the IDE environment.  
Algorand is NOT used to “measure” workload; it is used to **pay, commit, and log**.

---

## 4. Behavior for Light Workloads

If the workload is **Light**:

- The agent:
  - Executes the task using normal tools (filesystem, local analysis, free APIs).
  - MUST NOT touch wallets or Algorand unless explicitly instructed by the user for logging or testing.
- Optional (if configured):
  - Hash-of-input or hash-of-result may be logged on Algorand via Cos-alpha for audit, but ONLY if:
    - The user has enabled such logging, and
    - The agent confirms cost and gets approval.

If unsure between Light and Heavy, default to **Heavy** classification and seek user confirmation.

---

## 5. Behavior for Heavy / Chargeable Workloads

If the workload is **Heavy / Chargeable**, the agent MUST:

1. **Estimate Cost and Risk**
   - Ask Cos-alpha for a cost estimate (tokens, compute, approximate price).
   - Compare against the user’s configured budgets and policies.

2. **Prepare a Human-readable Summary**
   The agent MUST present a summary to the user, including:
   - What it wants to do.
   - Which external services will be used.
   - Estimated cost and frequency.
   - The fact that **Algorand** will be used for payment/logging.

   Example:
   > “This task will call a paid LLM API about 5 times and run a GPU job.  
   > Estimated cost: ~0.35 USDC on Algorand.  
   > I will pay using your Cos-alpha Algorand wallet and log a job ticket on-chain. Proceed?”

3. **Check and Enforce Budgets**
   - The agent MUST respect per-task / per-day / per-project budgets configured by the user.
   - If the budget would be exceeded, the agent MUST:
     - Ask the user to raise the limit, OR
     - Refuse to perform the Heavy operation.

4. **Route Payment and Commitments via Algorand**
   - The agent MUST call Cos-alpha’s Algorand/x402 tools to:
     - Create or reuse an Algorand wallet (testnet by default, mainnet only when enabled).
     - Generate and sign payment transactions as required.
     - Optionally create “job tickets” or receipts on-chain (e.g., a small transaction including job ID or hashes).
   - The agent MUST NOT construct raw Algorand transactions itself; it delegates to Cos-alpha.

5. **Execute Only After Successful Payment/Commitment**
   - If payment/commitment through Algorand succeeds, the agent may proceed with:
     - Calling the paid APIs.
     - Launching the heavy compute job.
     - Deploying or interacting with on-chain contracts as specified.
   - If payment fails or the user declines, the agent MUST:
     - Cancel the heavy part of the task.
     - Offer alternative, cheaper or local options if possible.

6. **Record and Expose Algorand Transaction IDs**
   - For each Heavy operation, the agent MUST record:
     - Algorand transaction ID(s).
     - Short description of what the job did.
     - Time and project context.
   - The agent should make this visible to the user (e.g., in an “AI Payments / On-chain Activity” panel).

---

## 6. Safety and Permissions

- The agent MUST:
  - Never move funds to addresses other than:
    - Known service providers specified by Cos-alpha.
    - User-approved addresses.
  - Never deploy or modify smart contracts without:
    - A clear description to the user.
    - An explicit confirmation.

- The agent MUST always:
  - Prefer Algorand **testnet** for experiments.
  - Require an explicit switch to **mainnet** with clear warning.
  - Obey all spending caps and policy rules.

If the agent is uncertain whether an action involves money or chain effects, it MUST treat it as **Chargeable / Heavy** and ask the user.

---

## 7. Agent Prompt Summary (for system messages)

When integrating into AI IDEs (Cursor, Antigravity, Windsurf), add the following short summary to the system prompt:

> - You are integrated with Cos-alpha and Algorand.  
> - You MUST route all paid or on-chain actions through Cos-alpha’s Algorand tools.  
> - You MUST estimate workload and cost, classify tasks as Light or Heavy, and only use Algorand for Heavy/Chargeable tasks.  
> - You MUST present clear cost summaries and get explicit user approval before spending funds or writing to the blockchain.  
> - You MUST respect budgets, policies, and testnet/mainnet modes at all times.

---