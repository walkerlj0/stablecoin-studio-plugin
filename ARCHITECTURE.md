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
4. [Service Layer](#service-layer)
5. [Configuration Management](#configuration-management)
6. [Build & Deployment](#build--deployment)

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
├── package.json
├── tsconfig.json                     # TypeScript configuration
└── tsup.config.ts                    # Build configuration
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

**For more information:**
- [PRD.md](./.windsurf/PRD.md) - Complete product requirements
- [README.md](./README.md) - User-facing documentation
- [SETUP.md](./SETUP.md) - Setup and configuration guide
