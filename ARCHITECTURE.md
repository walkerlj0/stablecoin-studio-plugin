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

For the canonical implementation (kept in source, not duplicated here), see:

- **Tool implementation**: [`src/tools/lifecycle/create-stablecoin.ts`](src/tools/lifecycle/create-stablecoin.ts)
- **Parameter schema**: [`src/schemas/lifecycle.schema.ts`](src/schemas/lifecycle.schema.ts) (`createStablecoinSchema`)
- **SDK initialization/service**: [`src/service/stablecoin-sdk.service.ts`](src/service/stablecoin-sdk.service.ts) (`getStablecoinSDK().ensureInitialized(...)`)

At a high level, each tool factory returns a `Tool` object with:

- `method` (a stable string constant exported for filtering)
- `name` / `description` (often built with `PromptGenerator`)
- `parameters` (Zod schema)
- `execute` (initializes the SDK, calls the Stablecoin SDK, and normalizes `{ raw, humanMessage }`)

**Pattern Breakdown:**

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | **Imports** | SDK classes, schemas, constants, service |
| 2 | **Tool Constant** | Unique identifier exported for filtering |
| 3 | **Prompt Generator** | Context-aware AI-readable description |
| 4 | **Tool Factory** | Default export returning Tool interface |
| 5 | **Execute Logic** | Orchestrates SDK calls and formatting |

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
