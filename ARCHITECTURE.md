# Architecture Documentation
# Stablecoin Studio Plugin for Hedera Agent Kit

**Version:** 1.0
**Last Updated:** 2026-01-08
**Status:** In Development (Lifecycle tools complete)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [Integration Patterns](#integration-patterns)
6. [Tool Implementation Guide](#tool-implementation-guide)
7. [Service Layer](#service-layer)
8. [Schema Architecture](#schema-architecture)
9. [Configuration Management](#configuration-management)
10. [Error Handling Strategy](#error-handling-strategy)
11. [Build & Deployment](#build--deployment)
12. [Extensibility](#extensibility)
13. [Best Practices](#best-practices)

---

## Executive Summary

The **Stablecoin Studio Plugin** is a TypeScript-based plugin for the Hedera Agent Kit that enables AI agents to autonomously create and manage stablecoins on the Hedera network. It wraps the Stablecoin Studio SDK and provides a comprehensive suite of tools organized into logical categories.

**Key Architectural Features:**
- **43 total tools** across 7 categories (6 lifecycle tools currently implemented)
- **Singleton SDK service** for efficient initialization and connection management
- **Schema-first design** with Zod validation and TypeScript type inference
- **Factory pattern** for context-aware tool instantiation
- **Standardized execution flow** with consistent error handling
- **Path aliases** (`@/`) for clean imports and maintainability

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent / LangChain                      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│               Hedera Agent Kit Framework                     │
│  - Plugin registry and tool discovery                       │
│  - Context management and dependency injection              │
│  - Tool execution and response formatting                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│          Stablecoin Studio Plugin (This Project)            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Plugin Export Layer                      │   │
│  │  (src/index.ts)                                      │   │
│  │  - Plugin interface implementation                   │   │
│  │  - Tool factory aggregation                          │   │
│  │  - Constant exports for filtering                    │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Tool Layer                               │   │
│  │  (src/tools/*/...)                                   │   │
│  │  - Tool factories (accept Context)                   │   │
│  │  - Prompt generators (PromptGenerator)               │   │
│  │  - Execution orchestration                           │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         Schema Validation Layer                       │   │
│  │  (src/schemas/*)                                     │   │
│  │  - Zod schema factories                              │   │
│  │  - Type inference and exports                        │   │
│  │  - Reusable atoms (accountId, tokenId, etc.)        │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Service Layer                            │   │
│  │  (src/service/stablecoin-sdk.service.ts)            │   │
│  │  - Singleton SDK instance                            │   │
│  │  - Network initialization (Network.init)             │   │
│  │  - Account connection (Network.connect)              │   │
│  │  - Configuration management                          │   │
│  │  - State tracking (initialized, connected)           │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│         Stablecoin Studio SDK (@hashgraph/stablecoin-npm-sdk) │
│  - StableCoin class (create, update, pause, etc.)            │
│  - Role class (grant/revoke roles)                           │
│  - Network class (init, connect)                             │
│  - Request/Response objects                                  │
└──────────────────────────┬────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│                     Hedera Network                            │
│  - Hedera Token Service (HTS)                                │
│  - Smart contracts (proxy, reserve)                          │
│  - Mirror Node API                                           │
│  - JSON-RPC relay                                            │
└───────────────────────────────────────────────────────────────┘
```

### Tool Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AI Agent Request                                          │
│    "Create a stablecoin called MyUSD with 6 decimals"       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 2. LangChain Tool Selection                                  │
│    - Analyzes available tools via descriptions              │
│    - Selects: stablecoin.create_stablecoin                  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 3. Parameter Extraction & Validation                         │
│    - LangChain extracts: {name: "MyUSD", decimals: 6}      │
│    - Zod validates schema                                   │
│    - Fills in defaults (initialSupply: 0, etc.)            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 4. Tool Execute Method                                       │
│    a. SDK Service initialization                            │
│       - getStablecoinSDK().ensureInitialized()              │
│    b. Build SDK request object                              │
│       - new CreateRequest({...params})                      │
│    c. Call SDK operation                                    │
│       - await StableCoin.create(request)                    │
│    d. Process response                                      │
│       - Extract tokenId, addresses, etc.                    │
│    e. Return formatted result                               │
│       - {raw: {...}, humanMessage: "..."}                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 5. Agent Kit Response Handling                               │
│    - Returns result to LangChain                            │
│    - LangChain processes humanMessage                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 6. AI Agent Response                                         │
│    "I've created MyUSD (token ID: 0.0.123456)"             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
stablecoin-studio-plugin/
├── .windsurf/
│   └── PRD.md                        # Product requirements document
├── examples/
│   └── stablecoin-studio-sdk-smoke-test.ts  # SDK connectivity test
├── src/
│   ├── index.ts                      # Main plugin export
│   ├── schemas/                      # Zod validation schemas
│   │   ├── atoms.ts                  # Reusable schema building blocks
│   │   └── lifecycle.schema.ts       # Lifecycle tool parameters
│   ├── service/                      # SDK integration layer
│   │   └── stablecoin-sdk.service.ts # Singleton SDK service
│   ├── tools/                        # Tool implementations
│   │   └── lifecycle/                # Lifecycle category (6 tools)
│   │       ├── create-stablecoin.ts
│   │       ├── get-stablecoin-info.ts
│   │       ├── update-stablecoin.ts
│   │       ├── pause-stablecoin.ts
│   │       ├── unpause-stablecoin.ts
│   │       └── delete-stablecoin.ts
│   └── utils/
│       └── constants.ts              # Tool names and network configs
├── ARCHITECTURE.md                   # This document
├── CLAUDE.md                         # Agent instructions
├── README.md                         # User-facing documentation
├── SETUP.md                          # Setup and configuration guide
├── package.json
├── tsconfig.json                     # TypeScript configuration
└── tsup.config.ts                    # Build configuration
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Tool files | `kebab-case.ts` | `create-stablecoin.ts` |
| Schema files | `[category].schema.ts` | `lifecycle.schema.ts` |
| Service files | `[name].service.ts` | `stablecoin-sdk.service.ts` |
| Constants | `UPPER_SNAKE_CASE` | `CREATE_STABLECOIN_TOOL` |
| Functions | `camelCase` | `ensureInitialized()` |
| Classes | `PascalCase` | `StablecoinSDKService` |
| Types/Interfaces | `PascalCase` | `CreateStablecoinParams` |

---

## Core Components

### 1. Plugin Export (src/index.ts)

**Purpose:** Main entry point that exports the plugin interface to Hedera Agent Kit.

```typescript
import { Context, Plugin } from 'hedera-agent-kit';
import createStablecoinTool from '@/tools/lifecycle/create-stablecoin';
import getStablecoinInfoTool from '@/tools/lifecycle/get-stablecoin-info';
// ... other imports

export default {
  name: 'stablecoin-studio-plugin',
  version: '1.0.0',
  description: 'Hedera Stablecoin Studio operations for AI agents...',

  // Tool factory function
  tools: (context: Context) => {
    return [
      createStablecoinTool(context),
      getStablecoinInfoTool(context),
      updateStablecoinTool(context),
      pauseStablecoinTool(context),
      unpauseStablecoinTool(context),
      deleteStablecoinTool(context),
    ];
  },
} satisfies Plugin;

// Export tool constants and types for external use
export * from '@/utils/constants';
export * from '@/schemas/atoms';
export * from '@/schemas/lifecycle.schema';
```

**Key Design Decisions:**
- Uses `satisfies Plugin` for TypeScript type checking without losing type inference
- Default export (not named) for standard plugin consumption
- Tools array is generated by calling factory functions with context
- Exports constants and types for advanced filtering and typing

---

### 2. Tool Factory Pattern

Each tool follows a standardized factory pattern:

```typescript
// File: src/tools/lifecycle/create-stablecoin.ts

import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import {
  StableCoin,
  CreateRequest,
  TokenSupplyType,
} from '@hashgraph/stablecoin-npm-sdk';
import { createStablecoinSchema } from '@/schemas/lifecycle.schema';
import { CREATE_STABLECOIN_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

/**
 * Tool constant for external reference
 */
export const TOOL_NAME = CREATE_STABLECOIN_TOOL;

/**
 * Tool description generator using PromptGenerator
 * Provides context-aware descriptions for AI agents
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool creates a new stablecoin token on the Hedera network with customizable properties.

Parameters:
- name (string, required): Token name (e.g., "MyUSD Stablecoin")
- symbol (string, required): Token symbol (e.g., "MUSDC")
- decimals (number, optional, default: 6): Decimal places (0-18)
- initialSupply (number, optional, default: 0): Initial supply in base units
- maxSupply (number, optional): Maximum supply limit (enables FINITE supply)
- supplyType (enum, optional): "FINITE" or "INFINITE"
- proofOfReserve (boolean, optional, default: false): Enable reserve tracking
- memo (string, optional): Token metadata (max 100 characters)
- [keys and roles...]

Returns:
- tokenId: The newly created stablecoin's token ID
- proxyAddress: Smart contract proxy address
- reserveAddress: Reserve data feed address (if proofOfReserve enabled)
- treasury: Treasury account ID

Important Notes:
- Operator account is assigned all roles by default
- Keys can be customized or disabled with 'null'
- Proof of reserve creates an additional data feed contract

${usageInstructions}
`;
};

/**
 * Tool factory function - default export
 * Creates a Tool instance with the provided context
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Create Stablecoin',
  description: toolPrompt(context),
  parameters: createStablecoinSchema(context),

  execute: async (client, context, params) => {
    try {
      // 1. Initialize SDK (idempotent)
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      // 2. Extract operator account
      const operatorAccountId =
        client?.operatorAccountId?.toString() ||
        process.env.HEDERA_ACCOUNT_ID ||
        '';

      if (!operatorAccountId) {
        throw new Error('Operator account ID not found');
      }

      // 3. Determine supply type
      const supplyType = params.maxSupply !== undefined
        ? TokenSupplyType.FINITE
        : (params.supplyType === 'FINITE' ? TokenSupplyType.FINITE : TokenSupplyType.INFINITE);

      // 4. Build SDK request
      const createRequest = new CreateRequest({
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        initialSupply: params.initialSupply?.toString() || '0',
        maxSupply: params.maxSupply?.toString(),
        supplyType,
        metadata: params.memo,

        // Keys - use 'null' string to indicate no key
        freezeKey: params.freezeKey ? { key: params.freezeKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        kycKey: params.kycKey ? { key: params.kycKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        wipeKey: params.wipeKey ? { key: params.wipeKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        pauseKey: params.pauseKey ? { key: params.pauseKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        feeScheduleKey: params.feeScheduleKey ? { key: params.feeScheduleKey, type: 'ED25519' } : { key: 'null', type: 'null' },

        // Reserve configuration
        createReserve: params.proofOfReserve || false,

        // Role assignments - default to operator
        burnRoleAccount: operatorAccountId,
        wipeRoleAccount: operatorAccountId,
        rescueRoleAccount: operatorAccountId,
        pauseRoleAccount: operatorAccountId,
        freezeRoleAccount: operatorAccountId,
        deleteRoleAccount: operatorAccountId,
        kycRoleAccount: operatorAccountId,
        cashInRoleAccount: operatorAccountId,
        feeRoleAccount: operatorAccountId,
        proxyOwnerAccount: operatorAccountId,

        // Grant KYC to creator by default
        grantKYCToOriginalSender: true,

        // Default allowances
        cashInRoleAllowance: '0',

        // Configuration IDs (testnet defaults)
        configId: '0x0000000000000000000000000000000000000000000000000000000000000002',
        configVersion: 1,
      });

      // 5. Execute SDK operation
      const stableCoin = await StableCoin.create(createRequest);

      // 6. Extract result data
      const result = {
        tokenId: stableCoin?.coin?.tokenId?.toString() || '',
        proxyAddress: stableCoin?.coin?.proxyAddress?.toString(),
        reserveAddress: stableCoin?.coin?.reserveAddress?.toString(),
        treasury: stableCoin?.coin?.treasury?.toString(),
        name: stableCoin?.coin?.name || params.name,
        symbol: stableCoin?.coin?.symbol || params.symbol,
        decimals: stableCoin?.coin?.decimals || params.decimals,
        totalSupply: stableCoin?.coin?.totalSupply?.toString(),
        maxSupply: stableCoin?.coin?.maxSupply?.toString(),
        paused: stableCoin?.coin?.paused,
      };

      // 7. Return standardized response
      const humanMessage = `Successfully created stablecoin "${result.name}" (${result.symbol}) with token ID ${result.tokenId}. ${
        stableCoin?.coin?.reserveAddress
          ? `Proof of reserve enabled with reserve address ${result.reserveAddress}. `
          : ''
      }Treasury: ${result.treasury}`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to create stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
```

**Pattern Breakdown:**

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | **Imports** | SDK classes, schemas, constants, service |
| 2 | **Tool Constant** | Unique identifier exported for filtering |
| 3 | **Prompt Generator** | Context-aware AI-readable description |
| 4 | **Tool Factory** | Default export returning Tool interface |
| 5 | **Execute Logic** | Orchestrates SDK calls and formatting |

---

## Integration Patterns

### Pattern 1: SDK Service Integration

**Every tool follows this initialization pattern:**

```typescript
execute: async (client, context, params) => {
  // 1. Get singleton SDK service instance
  const sdk = getStablecoinSDK();

  // 2. Ensure SDK is initialized and connected
  //    (idempotent - safe to call multiple times)
  await sdk.ensureInitialized(client, context);

  // 3. Proceed with SDK operations
  const result = await StableCoin.operation(...);

  return { raw: result, humanMessage: '...' };
}
```

### Pattern 2: Parameter Transformation

**Schema → SDK Request Object:**

```typescript
// Zod validates these parameters
const params = {
  name: "MyUSD",
  symbol: "MUSDC",
  decimals: 6,
  memo: "My stablecoin"
};

// Transform to SDK request object
const request = new CreateRequest({
  name: params.name,
  symbol: params.symbol,
  decimals: params.decimals,
  metadata: params.memo,  // Note: 'memo' → 'metadata'
  // ... additional SDK-required fields
});
```

**Key Transformations:**
- `memo` → `metadata` (SDK uses different field name)
- Number → string conversion for amounts (SDK uses string decimals)
- Optional parameters → SDK defaults
- Account ID extraction from client/context/env

### Pattern 3: Response Normalization

**SDK Response → Plugin Response:**

```typescript
// SDK returns nested object structure
const sdkResponse = await StableCoin.create(request);

// Extract and flatten for agent consumption
const result = {
  tokenId: sdkResponse?.coin?.tokenId?.toString() || '',
  proxyAddress: sdkResponse?.coin?.proxyAddress?.toString(),
  reserveAddress: sdkResponse?.coin?.reserveAddress?.toString(),
  treasury: sdkResponse?.coin?.treasury?.toString(),
  name: sdkResponse?.coin?.name || params.name,
  // ... use optional chaining and fallbacks
};

// Return standardized format
return {
  raw: result,                    // Structured data for programmatic use
  humanMessage: 'Success message' // Natural language summary for AI
};
```

**Response Pattern:**
- `raw`: Complete structured data (JSON-serializable)
- `humanMessage`: Human-readable summary for AI interpretation
- Defensive extraction with `?.` and `|| fallback`
- Type coercion with `.toString()`

### Pattern 4: Error Handling

**Consistent error handling across all tools:**

```typescript
try {
  // Tool logic
  return { raw: result, humanMessage: '...' };
} catch (error) {
  // Never throw - always return error object
  const message = `Failed to [operation]: ${
    error instanceof Error ? error.message : String(error)
  }`;

  return {
    raw: { error: message },
    humanMessage: message
  };
}
```

**Error Philosophy:**
- Never throw exceptions from `execute()` methods
- Always return `{ raw, humanMessage }` format
- Errors are data, not control flow
- Agent Kit interprets errors gracefully

---

## Tool Implementation Guide

### Step-by-Step: Adding a New Tool

**1. Define Tool Constant**

```typescript
// In src/utils/constants.ts
export const NEW_OPERATION_TOOL = 'stablecoin.new_operation';
```

**2. Create Schema**

```typescript
// In src/schemas/[category].schema.ts
export const newOperationSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema,
    param1: z.string().describe('First parameter description'),
    param2: z.number().optional().describe('Optional second parameter'),
  });

export type NewOperationParams = z.infer<ReturnType<typeof newOperationSchema>>;
```

**3. Implement Tool**

```typescript
// In src/tools/[category]/new-operation.ts
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import { StableCoin } from '@hashgraph/stablecoin-npm-sdk';
import { newOperationSchema } from '@/schemas/[category].schema';
import { NEW_OPERATION_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

export const TOOL_NAME = NEW_OPERATION_TOOL;

const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

[Tool description]

Parameters:
- tokenId (string, required): Token ID to operate on
- param1 (string, required): First parameter
- param2 (number, optional): Second parameter

${usageInstructions}
`;
};

export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'New Operation',
  description: toolPrompt(context),
  parameters: newOperationSchema(context),

  execute: async (client, context, params) => {
    try {
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      // Call SDK method
      const result = await StableCoin.newOperation({
        tokenId: params.tokenId,
        param1: params.param1,
        param2: params.param2,
      });

      return {
        raw: result,
        humanMessage: `Successfully completed operation on ${params.tokenId}`,
      };
    } catch (error) {
      const message = `Failed operation: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
```

**4. Register Tool**

```typescript
// In src/index.ts
import newOperationTool from '@/tools/[category]/new-operation';

export default {
  // ...
  tools: (context: Context) => {
    return [
      // ... existing tools
      newOperationTool(context),  // Add here
    ];
  },
} satisfies Plugin;
```

**5. Export Schema Types (Optional)**

```typescript
// In src/index.ts
export * from '@/schemas/[category].schema';
```

---

## Service Layer

### StablecoinSDKService Architecture

**File:** `src/service/stablecoin-sdk.service.ts`

**Purpose:** Singleton service that manages Stablecoin Studio SDK initialization and network connectivity.

```typescript
export class StablecoinSDKService {
  // Singleton instance
  private static instance: StablecoinSDKService | null = null;

  // State tracking
  private isInitialized = false;
  private isConnected = false;
  private currentConfig: SDKConfig | null = null;

  // Private constructor (singleton pattern)
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): StablecoinSDKService {
    if (!StablecoinSDKService.instance) {
      StablecoinSDKService.instance = new StablecoinSDKService();
    }
    return StablecoinSDKService.instance;
  }

  /**
   * Ensure SDK is initialized and connected (idempotent)
   */
  async ensureInitialized(client: any, context: Context = {}): Promise<void> {
    const config = this.getConfigFromContext(client, context);

    // Skip if already initialized with same config
    if (this.isInitialized && this.isConnected && this.configMatches(config)) {
      return;
    }

    // Initialize network
    await this.initializeNetwork(config);

    // Connect to network
    await this.connectToNetwork(config);

    this.currentConfig = config;
    this.isInitialized = true;
    this.isConnected = true;
  }

  /**
   * Extract configuration from multiple sources
   */
  private getConfigFromContext(client: any, context: Context): SDKConfig {
    // Priority: Environment > Client > Context > Defaults
    const network = (process.env.NETWORK || (context as any).network || 'testnet') as 'mainnet' | 'testnet';
    const accountId = process.env.HEDERA_ACCOUNT_ID || client?.operatorAccountId?.toString() || '';
    const privateKey = process.env.HEDERA_PRIVATE_KEY || '';

    if (!accountId || !privateKey) {
      throw new Error('Missing required credentials: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY');
    }

    return {
      network,
      accountId,
      privateKey,
      factoryAddress: process.env.FACTORY_ADDRESS || (context as any).factoryAddress,
      resolverAddress: process.env.RESOLVER_ADDRESS || (context as any).resolverAddress,
    };
  }

  /**
   * Initialize Hedera network with SDK
   */
  private async initializeNetwork(config: SDKConfig): Promise<void> {
    const mirrorNodeConfig = this.getMirrorNodeConfig(config.network);
    const rpcNodeConfig = this.getRPCNodeConfig(config.network);

    const initRequest = new InitializationRequest({
      network: config.network,
      mirrorNode: mirrorNodeConfig,
      rpcNode: rpcNodeConfig,
      configuration: {
        factoryAddress: config.factoryAddress || this.getDefaultFactoryAddress(config.network),
        resolverAddress: config.resolverAddress || this.getDefaultResolverAddress(config.network),
      },
    });

    await Network.init(initRequest);
  }

  /**
   * Connect to network with account credentials
   */
  private async connectToNetwork(config: SDKConfig): Promise<void> {
    const mirrorNodeConfig = this.getMirrorNodeConfig(config.network);
    const rpcNodeConfig = this.getRPCNodeConfig(config.network);

    const account = {
      accountId: config.accountId,
      privateKey: {
        key: config.privateKey,
        type: 'ED25519',
      },
    };

    const connectRequest = new ConnectRequest({
      account: account,
      network: config.network,
      mirrorNode: mirrorNodeConfig,
      rpcNode: rpcNodeConfig,
      wallet: SupportedWallets.CLIENT,
    });

    await Network.connect(connectRequest);
  }

  // ... helper methods for network configs
}

/**
 * Convenience function to get SDK instance
 */
export const getStablecoinSDK = () => StablecoinSDKService.getInstance();
```

**Configuration Hierarchy:**

| Priority | Source | Example |
|----------|--------|---------|
| 1 (Highest) | Environment variables | `process.env.HEDERA_ACCOUNT_ID` |
| 2 | Hedera client object | `client?.operatorAccountId` |
| 3 | Context object | `context.network` |
| 4 (Lowest) | Defaults | `'testnet'` |

**Network Configurations:**

```typescript
// Testnet
{
  mirrorNode: 'https://testnet.mirrornode.hedera.com/api/v1/',
  jsonRpc: 'https://testnet.hashio.io/api',
  factoryAddress: '0.0.6431833',
  resolverAddress: '0.0.6431794'
}

// Mainnet
{
  mirrorNode: 'https://mainnet-public.mirrornode.hedera.com/api/v1/',
  jsonRpc: 'https://mainnet.hashio.io/api',
  factoryAddress: 'TBD',  // Must be configured
  resolverAddress: 'TBD'  // Must be configured
}
```

---

## Schema Architecture

### Schema Factory Pattern

**All schemas are factory functions:**

```typescript
// Generic pattern
export const operationSchema = (_context: Context = {}) =>
  z.object({
    field1: z.string().describe('Field 1 description'),
    field2: z.number().optional().describe('Optional field 2'),
  });

// Type inference
export type OperationParams = z.infer<ReturnType<typeof operationSchema>>;
```

**Why factory functions?**
- Future extensibility: Context can customize schemas
- Consistent API across all schemas
- Type safety with `z.infer<ReturnType<...>>`

### Atomic Schema Building Blocks

**File:** `src/schemas/atoms.ts`

```typescript
import { z } from 'zod';

// Hedera Account ID
export const accountIdSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected Hedera AccountId like 0.0.1234')
  .describe('Hedera AccountId (e.g., 0.0.1234)');

// Hedera Token ID
export const tokenIdSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected Hedera TokenId like 0.0.123456')
  .describe('Hedera TokenId (e.g., 0.0.123456)');

// Token decimals
export const decimalsSchema = z
  .number()
  .int()
  .min(0)
  .max(18)
  .optional()
  .default(6)
  .describe('Number of decimal places (0-18, default: 6)');

// Role enumeration
export const roleSchema = z
  .enum(['ADMIN', 'CASHIN', 'BURN', 'WIPE', 'RESCUE', 'PAUSE', 'FREEZE', 'KYC', 'DELETE', 'FEE'])
  .describe('Role type: ADMIN (full control), CASHIN (mint), BURN (burn from treasury), WIPE (remove from accounts), RESCUE (recover assets), PAUSE (pause/unpause), FREEZE (freeze accounts), KYC (manage KYC status), DELETE (delete token), FEE (manage custom fees)');

// Supply type
export const supplyTypeSchema = z
  .enum(['FINITE', 'INFINITE'])
  .optional()
  .describe('Token supply type: FINITE (limited supply with maxSupply) or INFINITE (unlimited supply)');

// Memo field
export const memoSchema = z
  .string()
  .max(100)
  .optional()
  .describe('Optional memo or metadata (max 100 characters)');
```

**Atom Composition:**

```typescript
// Example: Composing atoms into a full schema
export const grantRoleSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema,
    targetAccount: accountIdSchema.describe('Account to grant role to'),
    role: roleSchema,
    allowance: z.number().optional().describe('Allowance for CASHIN role (optional)'),
  });
```

---

## Configuration Management

### Environment Variables

**Required:**
```bash
HEDERA_ACCOUNT_ID=0.0.xxxxx      # Your Hedera account ID
HEDERA_PRIVATE_KEY=0x...         # Private key (ECDSA or ED25519)
NETWORK=testnet                  # 'mainnet' or 'testnet'
```

**Optional:**
```bash
FACTORY_ADDRESS=0.0.xxxxx        # Custom factory contract address
RESOLVER_ADDRESS=0.0.xxxxx       # Custom resolver contract address
```

### TypeScript Configuration

**Path Aliases (tsconfig.json):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage:**
```typescript
// Instead of:
import { schema } from '../../../schemas/lifecycle.schema';

// Use:
import { schema } from '@/schemas/lifecycle.schema';
```

---

## Error Handling Strategy

### Principles

1. **Never throw from execute()**: Always return error objects
2. **Structured errors**: `{ raw: { error }, humanMessage }`
3. **Type-safe extraction**: `error instanceof Error ? error.message : String(error)`
4. **Context preservation**: Include operation name in error messages

### Error Response Format

```typescript
// Success response
return {
  raw: {
    tokenId: '0.0.123456',
    // ... result data
  },
  humanMessage: 'Successfully created stablecoin MyUSD'
};

// Error response
return {
  raw: {
    error: 'Failed to create stablecoin: Token symbol already exists'
  },
  humanMessage: 'Failed to create stablecoin: Token symbol already exists'
};
```

### Common Error Scenarios

| Error Type | Handling Strategy |
|------------|-------------------|
| **SDK Initialization** | Return error with "SDK initialization failed" message |
| **Network Connection** | Return error with network details and troubleshooting hint |
| **Missing Credentials** | Return error specifying which env vars are missing |
| **Invalid Parameters** | Zod catches before execute(), returns validation error |
| **SDK Operation Failure** | Wrap SDK error message with operation context |
| **Insufficient Permissions** | Return role requirement in error message |

---

## Build & Deployment

### Build Configuration (tsup.config.ts)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],           // CommonJS + ESM
  dts: true,                         // Generate .d.ts files
  sourcemap: true,                   // Include source maps
  clean: true,                       // Clean dist before build
  splitting: false,
  external: [
    'hedera-agent-kit',
    '@hashgraph/sdk',
    '@hashgraph/stablecoin-npm-sdk',
  ],
});
```

**Output Structure:**
```
dist/
├── index.js         # ESM build
├── index.js.map     # ESM source map
├── index.d.ts       # TypeScript declarations (ESM)
├── index.cjs        # CommonJS build
├── index.cjs.map    # CJS source map
└── index.d.cts      # TypeScript declarations (CJS)
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write .",
    "test": "tsx examples/stablecoin-studio-sdk-smoke-test.ts"
  }
}
```

### npm Link Development Workflow

See [SETUP.md](./SETUP.md) for complete npm link instructions.

**Quick Reference:**
```bash
# In stablecoin-studio-plugin/
npm link

# In hedera-agent-kit-js/
npm link stablecoin-studio-plugin

# After changes, rebuild and changes are live
npm run build
```

---

## Extensibility

### Adding a New Tool Category

**Step 1: Create Schema File**
```bash
touch src/schemas/[category].schema.ts
```

```typescript
// src/schemas/[category].schema.ts
import { z } from 'zod';
import type { Context } from 'hedera-agent-kit';
import { tokenIdSchema, accountIdSchema } from '@/schemas/atoms';

export const operation1Schema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema,
    param1: z.string().describe('Parameter 1 description'),
  });

export type Operation1Params = z.infer<ReturnType<typeof operation1Schema>>;
```

**Step 2: Create Tool Directory**
```bash
mkdir -p src/tools/[category]
```

**Step 3: Implement Tools**
```bash
touch src/tools/[category]/operation-1.ts
```

Follow the [Tool Implementation Guide](#tool-implementation-guide).

**Step 4: Add Tool Constants**
```typescript
// In src/utils/constants.ts
export const OPERATION_1_TOOL = '[category].operation_1';
```

**Step 5: Register Tools in Plugin**
```typescript
// In src/index.ts
import operation1Tool from '@/tools/[category]/operation-1';

export default {
  // ...
  tools: (context: Context) => [
    // ... existing tools
    operation1Tool(context),
  ],
} satisfies Plugin;
```

**Step 6: Export Types (Optional)**
```typescript
// In src/index.ts
export * from '@/schemas/[category].schema';
```

---

## Best Practices

### Code Quality

- **TypeScript Strict Mode**: Always enabled
- **No `any` types**: Use proper types or `unknown`
- **Exhaustive error handling**: Catch and return all errors
- **Descriptive naming**: Clear function and variable names
- **Documentation**: JSDoc comments for public APIs

### Schema Design

- **Self-documenting**: Every field has `.describe()`
- **Validation first**: Zod catches bad inputs before execution
- **Type inference**: Export types with `z.infer<>`
- **Reusable atoms**: Compose schemas from common building blocks
- **Optional with defaults**: Use `.optional().default(value)`

### Tool Design

- **Single responsibility**: One tool = one operation
- **Idempotent initialization**: Safe to call `ensureInitialized()` repeatedly
- **Defensive extraction**: Use optional chaining (`?.`) and fallbacks
- **Human-readable messages**: AI agents parse `humanMessage`
- **Structured results**: `raw` contains complete, typed data

### Testing

- **Unit tests**: Test each tool in isolation
- **Integration tests**: Test full tool execution with testnet
- **SDK smoke tests**: Verify SDK connectivity before building tools
- **Type checking**: Run `npm run typecheck` before commit
- **Linting**: Run `npm run lint` to catch issues early

---

## Conclusion

The Stablecoin Studio Plugin demonstrates a well-architected, production-ready approach to building Hedera Agent Kit plugins. The architecture emphasizes:

- **Modularity**: Clear separation of concerns (tools, schemas, services)
- **Type Safety**: Full TypeScript strict mode + Zod runtime validation
- **Maintainability**: Consistent patterns and path aliases
- **Extensibility**: Easy to add new tools following established templates
- **Documentation**: Self-documenting code via schema descriptions

With 6 lifecycle tools fully implemented and a proven pattern in place, the plugin is ready for expansion to the remaining 37 tools across 6 additional categories.

---

**For more information:**
- [PRD.md](./.windsurf/PRD.md) - Complete product requirements
- [README.md](./README.md) - User-facing documentation
- [SETUP.md](./SETUP.md) - Setup and configuration guide
- [CLAUDE.md](./CLAUDE.md) - Agent development instructions
