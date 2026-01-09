# Product Requirements Document: Stablecoin Studio Plugin for Hedera Agent Kit

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Planning
**Author:** AI Agent

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Goals and Objectives](#goals-and-objectives)
4. [Technical Architecture](#technical-architecture)
5. [Plugin Structure](#plugin-structure)
6. [Feature Groups and Tools](#feature-groups-and-tools)
7. [Implementation Plan](#implementation-plan)
8. [Dependencies and Setup](#dependencies-and-setup)
9. [Development Guidelines](#development-guidelines)
10. [Testing Strategy](#testing-strategy)
11. [Success Metrics](#success-metrics)
12. [Future Enhancements](#future-enhancements)

---

## 1. Executive Summary

This document outlines the requirements for building a **Stablecoin Studio Plugin** for the Hedera Agent Kit. The plugin will enable AI agents to autonomously create, manage, and operate stablecoins on the Hedera network using LangChain and the Hedera Agent Kit framework.

The plugin will wrap the Stablecoin Studio SDK's functionality into AI-ready tools, grouped into logical plugins covering:
- Stablecoin lifecycle management
- Role-based access control
- Compliance and security operations
- Reserve management
- Advanced features (holds, fees)
- Query and analytics

---

## 2. Project Overview

### 2.1 Purpose

The Stablecoin Studio Plugin allows AI agents to interact with the Hedera Stablecoin Studio, enabling:
- Autonomous stablecoin creation and configuration
- Programmatic token operations (mint, burn, transfer)
- Access control and compliance management
- Reserve tracking and collateralization monitoring
- Advanced DeFi primitives (holds/escrow, custom fees)

### 2.2 Context

- **Base Repository:** `/Users/lindsayjo/Git/stablecoin-studio`
- **Plugin Framework:** `/Users/lindsayjo/Git/hedera-agent-kit-js`
- **Plugin Template:** `/Users/lindsayjo/Git/template-hedera-agent-kit-plugin` (PRIMARY REFERENCE)
- **Reference Plugin:** `/Users/lindsayjo/Git/hedera-agent-kit-saucer-swap-plugin`
- **Target Location:** `/Users/lindsayjo/Git/stablecoin-studio-plugin`

### 2.3 Key Stakeholders

- Stablecoin issuers and treasury managers
- Compliance officers and KYC administrators
- DeFi protocol developers
- AI/automation engineers
- Hedera ecosystem developers

---

## 3. Goals and Objectives

### 3.1 Primary Goals

1. **Enable AI-Driven Stablecoin Management**: Allow AI agents to create and operate stablecoins autonomously
2. **Simplify Complex Operations**: Abstract Stablecoin Studio SDK complexity into simple tool calls
3. **Support Multiple Use Cases**: Cover treasury management, compliance, security, and DeFi workflows
4. **Maintain Type Safety**: Leverage Zod schemas and TypeScript for robust validation
5. **Follow Best Practices**: Replicate the architecture patterns from successful plugins

### 3.2 Success Criteria

- AI agents can create stablecoins with a single tool call
- All critical SDK operations are exposed as tools
- Tools are properly grouped into logical plugins (2-10 tools per plugin)
- Comprehensive error handling and validation
- Full LangChain integration with proper tool descriptions
- Production-ready code quality with testing

---

## 4. Technical Architecture

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Stablecoin Studio Plugin                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Plugin Layer                             │   │
│  │  - StablecoinLifecycle Plugin                        │   │
│  │  - AccessControl Plugin                              │   │
│  │  - Compliance Plugin                                 │   │
│  │  - Treasury Plugin                                   │   │
│  │  - Reserve Plugin                                    │   │
│  │  - Advanced Plugin                                   │   │
│  │  - Query Plugin                                      │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Service Layer                            │   │
│  │  - StablecoinConfigService                           │   │
│  │  - NetworkService                                    │   │
│  │  - ParameterNormalizer                               │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         Stablecoin Studio SDK                         │   │
│  │  (from /Users/lindsayjo/Git/stablecoin-studio)       │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   Hedera Network     │
                │  - HTS (Tokens)      │
                │  - Smart Contracts   │
                │  - Mirror Node       │
                └──────────────────────┘
```

### 4.2 Integration with Hedera Agent Kit

```typescript
// Plugin registration
import { stablecoinStudioPlugin } from 'stablecoin-studio-plugin';
import { HederaLangchainToolkit } from 'hedera-agent-kit';

const toolkit = new HederaLangchainToolkit({
  client: hederaClient,
  configuration: {
    plugins: [stablecoinStudioPlugin]
  }
});

// Tools become available to LangChain agents
const tools = toolkit.tools;
```

### 4.3 Tool Execution Flow

```
AI Agent Request
      │
      ▼
LangChain Tool Selection
      │
      ▼
HederaAgentKitTool Wrapper
      │
      ▼
Plugin Tool Execute Method
      │
      ├─► Parameter Validation (Zod)
      │
      ├─► Parameter Normalization
      │
      ├─► Stablecoin Studio SDK Call
      │
      ├─► Result Post-Processing
      │
      ▼
Formatted Response to Agent
```

---

## 5. Plugin Structure

### 5.1 Directory Structure

Following the **template-hedera-agent-kit-plugin** structure (PRIMARY REFERENCE):

```
stablecoin-studio-plugin/
├── .git/
├── .gitignore
├── .env
├── .env.example
├── LICENSE
├── .windsurf/
│   └── PRD.md
├── eslint.config.mjs
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── SETUP.md
├── examples/
│   └── stablecoin-studio-sdk-smoke-test.ts
└── src/
    ├── index.ts
    ├── tools/
    │   └── lifecycle/
    │       ├── create-stablecoin.ts
    │       ├── delete-stablecoin.ts
    │       ├── get-stablecoin-info.ts
    │       ├── pause-stablecoin.ts
    │       ├── unpause-stablecoin.ts
    │       └── update-stablecoin.ts
    ├── schemas/
    │   ├── atoms.ts
    │   └── lifecycle.schema.ts
    ├── service/
    │   └── stablecoin-sdk.service.ts
    └── utils/
        └── constants.ts
```

**Key Structural Changes from Template:**
- **Schemas live in `src/schemas/`** for centralized Zod validation
- **Path aliases** (@/) configured in tsconfig.json
- **examples/** currently contains a single SDK smoke test script
- **Tools** are currently implemented only for the **lifecycle** category
- **utils/** currently contains only `constants.ts`

### 5.2 Core Files

#### **index.ts**
Main plugin export using `satisfies Plugin` pattern from template:

```typescript
import { Context, Plugin } from 'hedera-agent-kit';

// Import all tool factories
import createStablecoinTool from '@/tools/lifecycle/create-stablecoin';
import getStablecoinInfoTool from '@/tools/lifecycle/get-stablecoin-info';
// ... import all other tools

export default {
  name: 'stablecoin-studio-plugin',
  version: '1.0.0',
  description: 'Hedera Stablecoin Studio operations for AI agents',
  tools: (context: Context) => {
    return [
      // Lifecycle tools
      createStablecoinTool(context),
      getStablecoinInfoTool(context),
      // ... all other tools
    ];
  },
} satisfies Plugin;

// Export tool name constants for filtering
export * from '@/utils/constants';
```

**Key Changes:**
- Uses `satisfies Plugin` for type safety
- Default export instead of named export
- Path aliases (@/) for clean imports
- Tools array directly lists tool factories
- No sub-plugin grouping (all tools in one plugin)

---

### 5.3 Tool Implementation Pattern

Implemented tools follow the standard Hedera Agent Kit pattern (tool constants, schema factories, `PromptGenerator`, and an `execute` method).

Implemented lifecycle tools:
- `src/tools/lifecycle/create-stablecoin.ts`
- `src/tools/lifecycle/get-stablecoin-info.ts`
- `src/tools/lifecycle/update-stablecoin.ts`
- `src/tools/lifecycle/pause-stablecoin.ts`
- `src/tools/lifecycle/unpause-stablecoin.ts`
- `src/tools/lifecycle/delete-stablecoin.ts`

```typescript
// Example: src/tools/lifecycle/delete-stablecoin.ts
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import { StableCoin, DeleteRequest } from '@hashgraph/stablecoin-npm-sdk';
import { deleteStablecoinSchema } from '@/schemas/lifecycle.schema';
import { DELETE_STABLECOIN_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

export const TOOL_NAME = DELETE_STABLECOIN_TOOL;

const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool permanently deletes a stablecoin token. This operation is irreversible.

Parameters:
- tokenId (string, required): Hedera token ID (e.g., "0.0.123456")

${usageInstructions}
`;
};

export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Delete Stablecoin',
  description: toolPrompt(context),
  parameters: deleteStablecoinSchema(context),
  execute: async (client, context, params) => {
    try {
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      const request = new DeleteRequest({ tokenId: params.tokenId });
      const success = await StableCoin.delete(request);

      if (!success) throw new Error('Delete operation returned false');

      return {
        raw: { tokenId: params.tokenId, success },
        humanMessage: `Successfully deleted stablecoin ${params.tokenId}.`,
      };
    } catch (error) {
      const message = `Failed to delete stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return { raw: { error: message }, humanMessage: message };
    }
  },
});
```

**Pattern Elements:**
1. **Tool constant** exported for referencing
2. **PromptGenerator** usage for context-aware descriptions
3. **Schema factory** from separate schemas folder
4. **Tool factory function** accepting Context
5. **Error handling** with structured return format
6. **Path aliases** (@/) for imports

---

### 5.4 Schema Pattern

```typescript
// Example: src/schemas/lifecycle.schema.ts
import { z } from 'zod';
import type { Context } from 'hedera-agent-kit';
import { tokenIdSchema } from '@/schemas/atoms';

export const getStablecoinInfoSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema.describe('Token ID of the stablecoin to query'),
  });
```

**Schema Elements:**
1. **Factory function** accepting Context
2. **Import atoms** for reusable schema pieces
3. **`.describe()`** on every field
4. **Type export** using `z.infer`

---

### 5.5 Common Schema Atoms

```typescript
// src/schemas/atoms.ts
import { z } from 'zod';

export const accountIdSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected Hedera AccountId like 0.0.1234')
  .describe('Hedera AccountId (e.g., 0.0.1234)');

export const tokenIdSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected Hedera TokenId like 0.0.123456')
  .describe('Hedera TokenId (e.g., 0.0.123456)');

export const memoSchema = z
  .string()
  .max(100, 'Max 100 chars')
  .describe('Optional transaction memo');

export const roleSchema = z
  .enum(['ADMIN', 'CASHIN', 'BURN', 'WIPE', 'RESCUE', 'PAUSE', 'FREEZE', 'KYC', 'DELETE', 'FEE'])
  .describe('Role type for stablecoin operations');
```

---

### 5.6 Utility Files

The current codebase includes a single utility module under `src/utils`.

#### **constants.ts**

```typescript
// Lifecycle tools
export const CREATE_STABLECOIN_TOOL = 'stablecoin.create_stablecoin';
export const GET_STABLECOIN_INFO_TOOL = 'stablecoin.get_stablecoin_info';
export const UPDATE_STABLECOIN_TOOL = 'stablecoin.update_stablecoin';
export const PAUSE_STABLECOIN_TOOL = 'stablecoin.pause_stablecoin';
export const UNPAUSE_STABLECOIN_TOOL = 'stablecoin.unpause_stablecoin';
export const DELETE_STABLECOIN_TOOL = 'stablecoin.delete_stablecoin';

// Plugin constants
export const DEFAULT_DECIMALS = 6;
export const DEFAULT_INITIAL_SUPPLY = 0;
export const MAX_DECIMALS = 18;
export const MAX_SUPPLY_LIMIT = 9223372036854775807; // Max int64

export type NetworkConfig = {
  mirrorNodeUrl: string;
  jsonRpcUrl: string;
  networkType: 'mainnet' | 'testnet';
};

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    jsonRpcUrl: 'https://mainnet.hashio.io/api',
    networkType: 'mainnet',
  },
  testnet: {
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    jsonRpcUrl: 'https://testnet.hashio.io/api',
    networkType: 'testnet',
  },
};
```

---

## 6. Feature Groups and Tools

Only the **Stablecoin Lifecycle** tools are implemented in the current codebase. The remaining tool groups below are planned.

### Group 1: Stablecoin Lifecycle Tool

**Purpose:** Create, configure, and manage stablecoin lifecycle

**Tools (6):**

1. **create_stablecoin_tool**
   - **Description:** Create a new stablecoin on Hedera with customizable parameters
   - **Parameters:**
     - `name` (string, required): Token name
     - `symbol` (string, required): Token symbol (e.g., "USDC")
     - `decimals` (number, optional, default: 6): Decimal places
     - `initialSupply` (number, optional, default: 0): Initial token supply
     - `maxSupply` (number, optional): Maximum supply limit
     - `proofOfReserve` (boolean, optional, default: false): Enable reserve tracking
     - `roles` (object, optional): Initial role assignments
   - **Returns:** Token ID, proxy address, reserve address (if enabled)
   - **SDK Method:** `StableCoin.create()`

2. **get_stablecoin_info_tool**
   - **Description:** Get detailed information about a stablecoin
   - **Parameters:**
     - `tokenId` (string, required): Token ID to query
   - **Returns:** Complete token details (name, symbol, supply, keys, roles, status)
   - **SDK Method:** `StableCoin.getInfo()`

3. **update_stablecoin_tool**
   - **Description:** Update stablecoin properties
   - **Parameters:**
     - `tokenId` (string, required): Token ID
     - `name` (string, optional): New token name
     - `symbol` (string, optional): New token symbol
     - `memo` (string, optional): New memo
   - **Returns:** Success confirmation
   - **SDK Method:** `StableCoin.update()`

4. **pause_stablecoin_tool**
   - **Description:** Pause all operations on a stablecoin
   - **Parameters:**
     - `tokenId` (string, required): Token ID to pause
   - **Returns:** Transaction ID and success status
   - **SDK Method:** `StableCoin.pause()`

5. **unpause_stablecoin_tool**
   - **Description:** Resume operations on a paused stablecoin
   - **Parameters:**
     - `tokenId` (string, required): Token ID to unpause
   - **Returns:** Transaction ID and success status
   - **SDK Method:** `StableCoin.unPause()`

6. **delete_stablecoin_tool**
   - **Description:** Permanently delete a stablecoin
   - **Parameters:**
     - `tokenId` (string, required): Token ID to delete
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `StableCoin.delete()`

---

### Group 2: Access Control Tool

**Purpose:** Manage role-based access control for stablecoin operations

**Tools (7):**

1. **grant_role_tool**
   - **Description:** Grant operational role to an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to grant role
     - `role` (enum, required): Role type (ADMIN, CASHIN, BURN, WIPE, etc.)
     - `supplyType` (enum, optional): For CASHIN role - LIMITED or UNLIMITED
     - `allowance` (number, optional): For LIMITED CASHIN - minting allowance
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `Role.grantRole()`

2. **revoke_role_tool**
   - **Description:** Remove role from an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to revoke role
     - `role` (enum, required): Role type to revoke
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `Role.revokeRole()`

3. **check_role_tool**
   - **Description:** Check if an account has a specific role
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to check
     - `role` (enum, required): Role type to check
   - **Returns:** Boolean indicating if account has role
   - **SDK Method:** `Role.hasRole()`

4. **get_account_roles_tool**
   - **Description:** Get all roles assigned to an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to query
   - **Returns:** Array of role names
   - **SDK Method:** `Role.getRoles()`

5. **get_accounts_with_role_tool**
   - **Description:** Get all accounts that have a specific role
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `role` (enum, required): Role type to search
   - **Returns:** Array of account IDs
   - **SDK Method:** `Role.getAccountsWithRole()`

6. **manage_allowance_tool**
   - **Description:** Manage cash-in allowance for limited suppliers
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Supplier account
     - `action` (enum, required): INCREASE, DECREASE, or RESET
     - `amount` (number, required for INCREASE/DECREASE): Allowance change
   - **Returns:** New allowance amount
   - **SDK Methods:** `Role.increaseAllowance()`, `decreaseAllowance()`, `resetAllowance()`

7. **get_allowance_tool**
   - **Description:** Get current cash-in allowance for a supplier
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Supplier account
   - **Returns:** Current allowance amount
   - **SDK Method:** `Role.getAllowance()`

---

### Group 3: Compliance Tool

**Purpose:** Manage KYC status and account freezing for compliance

**Tools (5):**

1. **grant_kyc_tool**
   - **Description:** Grant KYC status to an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to grant KYC
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `StableCoin.grantKyc()`

2. **revoke_kyc_tool**
   - **Description:** Revoke KYC status from an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to revoke KYC
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `StableCoin.revokeKyc()`

3. **check_kyc_tool**
   - **Description:** Check if an account has KYC status
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to check
   - **Returns:** Boolean indicating KYC status
   - **SDK Method:** `StableCoin.isAccountKYCGranted()`

4. **freeze_account_tool**
   - **Description:** Freeze an account to prevent token transfers
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to freeze
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `StableCoin.freeze()`

5. **unfreeze_account_tool**
   - **Description:** Unfreeze an account to allow token transfers
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to unfreeze
   - **Returns:** Transaction ID and confirmation
   - **SDK Method:** `StableCoin.unFreeze()`

---

### Group 4: Treasury Tool

**Purpose:** Mint, burn, and transfer stablecoin tokens

**Tools (6):**

1. **cash_in_tool**
   - **Description:** Mint new stablecoin tokens and transfer to target account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `amount` (number, required): Amount to mint (in base units)
     - `targetAccount` (string, required): Recipient account
   - **Returns:** Transaction ID, new total supply
   - **SDK Method:** `StableCoin.cashIn()`

2. **burn_tool**
   - **Description:** Burn stablecoin tokens from treasury
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `amount` (number, required): Amount to burn
   - **Returns:** Transaction ID, new total supply
   - **SDK Method:** `StableCoin.burn()`

3. **wipe_tool**
   - **Description:** Remove tokens from a specific account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, required): Account to wipe from
     - `amount` (number, required): Amount to wipe
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `StableCoin.wipe()`

4. **transfer_tool**
   - **Description:** Transfer tokens to one or more recipients
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `transfers` (array, required): Array of {account, amount} objects (max 9)
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `StableCoin.transfers()`

5. **rescue_token_tool**
   - **Description:** Rescue tokens from smart contract treasury
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `amount` (number, required): Amount to rescue
     - `targetAccount` (string, optional): Destination account
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `StableCoin.rescue()`

6. **rescue_hbar_tool**
   - **Description:** Rescue HBAR from smart contract treasury
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `amount` (number, required): Amount of HBAR to rescue (in tinybars)
     - `targetAccount` (string, optional): Destination account
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `StableCoin.rescueHBAR()`

---

### Group 5: Reserve Tool

**Purpose:** Manage proof of reserve and collateralization tracking

**Tools (2):**

1. **get_reserve_amount_tool**
   - **Description:** Get current reserve/collateral amount for a stablecoin
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
   - **Returns:** Reserve amount, reserve address
   - **SDK Method:** `ReserveDataFeed.getReserveAmount()`

2. **update_reserve_amount_tool**
   - **Description:** Update the reserve/collateral amount
   - **Parameters:**
     - `reserveAddress` (string, required): Reserve data feed address
     - `newAmount` (number, required): New reserve amount
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `ReserveDataFeed.updateReserveAmount()`

---

### Group 6: Advanced Features Tool

**Purpose:** Hold management (escrow) and custom fees

**Tools (6):**

1. **create_hold_tool**
   - **Description:** Create a hold (escrow) to lock tokens temporarily
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `amount` (number, required): Amount to lock
     - `escrowAccount` (string, required): Escrow holder account
     - `expirationTime` (number, required): Unix timestamp for expiration
     - `sourceAccount` (string, optional): Account to lock from
   - **Returns:** Hold ID, transaction confirmation
   - **SDK Method:** Internal hold creation via SDK

2. **execute_hold_tool**
   - **Description:** Execute a hold to complete the escrowed transfer
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `holdId` (string, required): Hold ID to execute
     - `sourceAccount` (string, required): Source account
     - `targetAccount` (string, required): Destination account
     - `amount` (number, required): Amount to transfer
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** Internal hold execution

3. **release_hold_tool**
   - **Description:** Release a hold without executing (return tokens)
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `holdId` (string, required): Hold ID to release
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** Internal hold release

4. **add_fixed_fee_tool**
   - **Description:** Add a fixed transaction fee to the stablecoin
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `amount` (number, required): Fixed fee amount
     - `collectorAccount` (string, required): Fee collector account
     - `denominatingTokenId` (string, optional): Token for fee payment
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `Fees.addFixedFee()`

5. **add_fractional_fee_tool**
   - **Description:** Add a fractional (percentage-based) transaction fee
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `numerator` (number, required): Fee fraction numerator
     - `denominator` (number, required): Fee fraction denominator
     - `minAmount` (number, optional): Minimum fee amount
     - `maxAmount` (number, optional): Maximum fee amount
     - `collectorAccount` (string, required): Fee collector account
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `Fees.addFractionalFee()`

6. **update_fee_schedule_tool**
   - **Description:** Update the complete custom fee schedule
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `customFees` (array, required): Array of fee definitions
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `Fees.updateCustomFees()`

---

### Group 7: Query Tools

**Purpose:** Read stablecoin state and account information

**Tools (5):**

1. **get_balance_tool**
   - **Description:** Get stablecoin balance for an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `accountId` (string, optional): Account to query (defaults to operator)
   - **Returns:** Balance amount
   - **SDK Method:** `StableCoin.getBalanceOf()`

2. **list_stablecoins_tool**
   - **Description:** List all stablecoins associated with an account
   - **Parameters:**
     - `accountId` (string, optional): Account to query (defaults to operator)
   - **Returns:** Array of stablecoin details
   - **SDK Method:** `Account.listStableCoins()`

3. **get_capabilities_tool**
   - **Description:** Get available operations and permissions for an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `accountId` (string, optional): Account to check (defaults to operator)
   - **Returns:** List of available operations and access methods
   - **SDK Method:** `StableCoin.capabilities()`

4. **check_association_tool**
   - **Description:** Check if a token is associated with an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `accountId` (string, required): Account to check
   - **Returns:** Boolean indicating association status
   - **SDK Method:** `StableCoin.isAccountAssociated()`

5. **associate_token_tool**
   - **Description:** Associate a stablecoin with an account
   - **Parameters:**
     - `tokenId` (string, required): Stablecoin token ID
     - `targetAccount` (string, optional): Account to associate (defaults to operator)
   - **Returns:** Transaction ID, confirmation
   - **SDK Method:** `StableCoin.associate()`

---

## 7. Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Tasks:**
1. Set up project structure and build configuration
2. Install dependencies (hedera-agent-kit, stablecoin-studio SDK, zod, etc.)
3. Create base service layer (config, network, SDK initialization)
4. Implement error classes and constants
5. Create Zod schemas for all parameters
6. Build parameter normalizer
7. Create utility functions (prompt generator, response formatter)

**Deliverables:**
- Project scaffolding complete
- Build system working (tsup, TypeScript, ESLint)
- Core infrastructure ready for tool implementation

---

### Phase 2: Core Tools (Week 3-4)

**Tasks:**
1. Implement Plugin 1: Stablecoin Lifecycle (6 tools)
2. Implement Plugin 4: Treasury Operations (6 tools)
3. Implement Plugin 7: Query Operations (5 tools)
4. Write unit tests for each tool
5. Create basic example agent

**Deliverables:**
- 17 core tools implemented and tested
- AI agents can create, manage, and query stablecoins
- Working example demonstrating tool usage

---

### Phase 3: Access Control & Compliance (Week 5-6)

**Tasks:**
1. Implement Plugin 2: Access Control (7 tools)
2. Implement Plugin 3: Compliance (5 tools)
3. Write comprehensive tool descriptions for AI understanding
4. Create integration tests
5. Build example agents for treasury management and compliance

**Deliverables:**
- 12 additional tools for access control and compliance
- Integration tests passing
- Example agents demonstrating real-world use cases

---

### Phase 4: Advanced Features (Week 7-8)

**Tasks:**
1. Implement Plugin 5: Reserve Management (2 tools)
2. Implement Plugin 6: Advanced Features (6 tools)
3. Complete test coverage (unit + integration)
4. Write comprehensive documentation (README, SETUP, API docs)
5. Create multiple example agents showcasing different scenarios

**Deliverables:**
- All 43 tools implemented
- 100% test coverage
- Production-ready documentation
- Multiple example agents

---

### Phase 5: Polish & Release (Week 9-10)

**Tasks:**
1. Performance optimization
2. Security audit and hardening
3. Error handling improvements
4. Tool description refinement for better AI performance
5. Example gallery creation
6. Release preparation (versioning, changelog, npm package)

**Deliverables:**
- Production-ready plugin
- Published to npm
- Comprehensive documentation site
- Community examples

---

## 8. Dependencies and Setup

### 8.1 Dependencies

**Production Dependencies:**
```json
{
  "hedera-agent-kit": "^3.5.2",
  "@hashgraph/stablecoin-npm-sdk": "^2.0.0",  // Actual SDK version TBD
  "zod": "^3.0.0",
  "tsup": "^8.5.0"
}
```

**Dev Dependencies:**
```json
{
  "@types/node": "^20.0.0",
  "@typescript-eslint/eslint-plugin": "^8.0.0",
  "@typescript-eslint/parser": "^8.0.0",
  "@vitest/coverage-v8": "^1.6.0",
  "eslint": "^9.0.0",
  "typescript": "^5.0.0",
  "vitest": "^1.6.0"
}
```

**Example Dependencies:**
```json
{
  "@langchain/core": "^1.0.4",
  "@langchain/openai": "^1.1.0",
  "dotenv": "^17.2.0",
  "prompts": "^2.4.2",
  "tsx": "^4.20.4"
}
```

### 8.2 Environment Variables

**Required:**
- `ACCOUNT_ID` - Hedera account ID
- `PRIVATE_KEY` - Account private key (ECDSA or ED25519)
- `NETWORK` - "mainnet" or "testnet"

**Optional:**
- `MIRROR_NODE_URL` - Custom mirror node URL
- `JSON_RPC_URL` - Custom JSON-RPC relay URL
- `OPENAI_API_KEY` - For LangChain examples

### 8.3 Stablecoin Studio SDK Integration

The plugin needs to integrate with the Stablecoin Studio SDK. Key setup steps:

1. **SDK Initialization:**
```typescript
import { Network, initializeFactory, StableCoin, Role } from '@hashgraph/stablecoin-npm-sdk';

// Initialize SDK
await initializeFactory();

// Connect to network
await Network.connect({
  account: { accountId, privateKey },
  network: 'testnet',
  mirrorNode: { url: mirrorNodeUrl },
  rpcNode: { url: jsonRpcUrl }
});
```

2. **Service Wrapper:**
```typescript
export class StablecoinSDKService {
  private initialized = false;

  async initialize(config: NetworkConfig) {
    if (!this.initialized) {
      await initializeFactory();
      await Network.connect(config);
      this.initialized = true;
    }
  }

  async createStablecoin(params: CreateParams) {
    await this.ensureInitialized();
    return await StableCoin.create(params);
  }

  // ... other methods
}
```

---

## 9. Development Guidelines

### 9.1 Code Style

- **TypeScript Strict Mode:** Enabled
- **ESLint Configuration:** TypeScript ESLint with recommended rules
- **Naming Conventions:**
  - Tool constants: `UPPER_SNAKE_CASE` with `_TOOL` suffix
  - Functions: `camelCase`
  - Classes: `PascalCase`
  - Files: `kebab-case.ts`

### 9.2 Tool Implementation Pattern

Each tool should follow this structure:

```typescript
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import { StableCoin, GetStableCoinDetailsRequest } from '@hashgraph/stablecoin-npm-sdk';
import { getStablecoinInfoSchema } from '@/schemas/lifecycle.schema';
import { GET_STABLECOIN_INFO_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

// Tool description generator
const toolPrompt = (context: Context) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);

  return `
${contextSnippet}

This tool [does something specific].

Parameters:
- tokenId (string, required): The stablecoin token ID to operate on

Important:
- This is a read-only operation

Example usage:
- Get details: {"tokenId": "0.0.123456"}

${PromptGenerator.getParameterUsageInstructions()}
`;
};

// Tool export
export default (context: Context): Tool => ({
  method: GET_STABLECOIN_INFO_TOOL,
  name: 'Human Readable Tool Name',
  description: toolPrompt(context),
  parameters: getStablecoinInfoSchema(context),
  execute: async (client, context, params) => {
    const sdk = getStablecoinSDK();
    await sdk.ensureInitialized(client, context);

    // Call Stablecoin Studio SDK
    const request = new GetStableCoinDetailsRequest({ id: params.tokenId });
    const result = await StableCoin.getInfo(request);

    return {
      raw: result,
      humanMessage: 'Successfully completed operation',
    };
  },
});
```

### 9.3 Testing Requirements

- **Unit Tests:** Every tool must have unit tests
- **Integration Tests:** Test end-to-end flows with testnet
- **Coverage Target:** 80% minimum
- **Test Structure:**
```typescript
describe('create_stablecoin_tool', () => {
  it('should create stablecoin with valid parameters', async () => {
    // Test implementation
  });

  it('should handle missing optional parameters', async () => {
    // Test implementation
  });

  it('should throw error for invalid parameters', async () => {
    // Test implementation
  });
});
```

### 9.4 Documentation Standards

- **Tool Descriptions:** Clear, detailed, with examples
- **Parameter Descriptions:** Include type, requirement, format, and constraints
- **README:** Installation, setup, usage examples
- **SETUP Guide:** Network configuration, environment setup
- **API Docs:** Generated from TypeScript types
- **Example Agents:** Real-world scenarios with comments

---

## 10. Testing Strategy

### 10.1 Unit Testing

**Tool-Level Tests:**
- Parameter validation (valid/invalid inputs)
- Zod schema correctness
- Error handling
- Response formatting

**Service-Level Tests:**
- SDK initialization
- Configuration management
- Network service
- Parameter normalization

### 10.2 Integration Testing

**End-to-End Flows:**
1. **Complete Lifecycle:**
   - Create stablecoin
   - Grant roles
   - Mint tokens
   - Transfer tokens
   - Check balances
   - Delete stablecoin

2. **Access Control:**
   - Grant multiple roles
   - Revoke roles
   - Check permissions
   - Attempt unauthorized operations

3. **Compliance Workflow:**
   - Grant KYC
   - Transfer tokens
   - Revoke KYC
   - Verify transfer blocked

### 10.3 AI Agent Testing

**LangChain Integration:**
- Test tool discovery
- Test tool selection by AI
- Test parameter extraction from natural language
- Test multi-step workflows

**Example Test Scenarios:**
- "Create a stablecoin called MyUSD with 6 decimals and max supply of 1 million"
- "Mint 10000 MyUSD tokens and send them to account 0.0.123456"
- "Freeze account 0.0.789 from MyUSD"

---

## 11. Success Metrics

### 11.1 Technical Metrics

- **Tool Count:** 43 tools across 7 plugins ✓
- **Test Coverage:** ≥80% ✓
- **Build Success Rate:** 100% ✓
- **Documentation Completeness:** 100% ✓

### 11.2 Performance Metrics

- **Tool Execution Time:** <5s for transactions, <1s for queries
- **SDK Initialization:** <3s
- **Error Rate:** <1% for valid inputs

### 11.3 Adoption Metrics

- **npm Downloads:** Track weekly downloads
- **GitHub Stars:** Community interest
- **Example Usage:** User-created agents
- **Issue Resolution:** Average time to resolve <48h

---

## 12. Future Enhancements

### 12.1 Phase 2 Features

1. **Batch Operations:**
   - Bulk KYC grants/revokes
   - Multi-token operations
   - Batch role assignments

2. **Advanced Analytics:**
   - Token distribution reports
   - Supply tracking over time
   - Compliance audit logs

3. **Multi-Signature Support:**
   - Coordinate multisig transactions
   - Approval workflow management

4. **Webhooks & Notifications:**
   - Event subscriptions (token created, minted, etc.)
   - Alert system for compliance issues

### 12.2 Integration Opportunities

1. **Price Oracle Integration:**
   - Combine with DeFi price feeds
   - Automated collateralization monitoring

2. **DeFi Protocol Integration:**
   - Liquidity pool creation (SaucerSwap)
   - Lending protocol integration
   - DEX aggregation

3. **Compliance Services:**
   - Identity verification APIs
   - Automated KYC workflows
   - Regulatory reporting

### 12.3 Developer Tools

1. **CLI Tool:**
   - Interactive stablecoin creation
   - Role management interface
   - Testing utilities

2. **Dashboard:**
   - Visual stablecoin management
   - Analytics and reporting
   - Agent activity monitoring

3. **Simulator:**
   - Test stablecoin operations without gas costs
   - Scenario modeling
   - Training environment

---

## 13. Risk Assessment & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SDK API Changes | High | Medium | Pin SDK versions, monitor releases |
| Network Outages | Medium | Low | Implement retry logic, fallback nodes |
| Gas Price Spikes | Low | Medium | Configurable gas limits, price monitoring |
| Key Management | High | Medium | Use KMS, secure storage recommendations |

### 13.2 Security Considerations

1. **Private Key Handling:**
   - Never log or expose private keys
   - Recommend KMS/vault solutions
   - Support hardware wallet integration

2. **Parameter Validation:**
   - Strict Zod schemas
   - Range checks for amounts
   - Account ID format validation

3. **Permission Checks:**
   - Verify role requirements before operations
   - Clear error messages for unauthorized actions

4. **Audit Trail:**
   - Log all operations (without sensitive data)
   - Transaction ID tracking
   - Error logging

---

## 14. Appendix

### 14.1 Role Types Reference

| Role | Description | Operations |
|------|-------------|------------|
| ADMIN | Full control | All operations |
| CASHIN | Mint tokens | cashIn() |
| BURN | Burn from treasury | burn() |
| WIPE | Wipe from accounts | wipe() |
| RESCUE | Rescue treasury assets | rescue(), rescueHBAR() |
| PAUSE | Pause/unpause token | pause(), unPause() |
| FREEZE | Freeze/unfreeze accounts | freeze(), unFreeze() |
| KYC | Manage KYC status | grantKyc(), revokeKyc() |
| DELETE | Delete token | delete() |
| FEE | Manage custom fees | addFixedFee(), addFractionalFee() |

### 14.2 Tool Priority Matrix

| Priority | Tools | Rationale |
|----------|-------|-----------|
| P0 (Critical) | create, getInfo, cashIn, transfer, getBalance | Core functionality |
| P1 (High) | grantRole, revokeRole, grantKyc, burn, pause | Essential management |
| P2 (Medium) | freeze, wipe, getAllowance, listStablecoins | Important operations |
| P3 (Low) | holds, fees, rescue, delete | Advanced features |

### 14.3 Error Code Reference

| Code | Description | User Action |
|------|-------------|-------------|
| SDK_INIT_ERROR | SDK failed to initialize | Check network config |
| INVALID_PARAMETER | Invalid input parameter | Review parameter format |
| TOKEN_NOT_FOUND | Stablecoin doesn't exist | Verify token ID |
| INSUFFICIENT_PERMISSIONS | Missing required role | Request role from admin |
| NETWORK_ERROR | Hedera network issue | Retry or check network status |
| INSUFFICIENT_BALANCE | Not enough tokens | Check balance |

---

## Conclusion

This PRD provides a comprehensive blueprint for building the Stablecoin Studio Agent Plugin. By following this document, developers can create a production-ready plugin that enables AI agents to autonomously create and manage stablecoins on the Hedera network.

The plugin's modular architecture, comprehensive tool coverage, and robust error handling make it suitable for a wide range of use cases, from treasury management to compliance automation to DeFi protocol integration.

**Next Steps:**
1. Review and approve this PRD
2. Begin Phase 1: Foundation implementation
3. Set up CI/CD pipeline
4. Create project repository and initial commit
5. Start development following the implementation plan

---

**Document Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-07 | AI Agent | Initial PRD creation |
