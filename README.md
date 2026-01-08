# Stablecoin Studio Plugin

A comprehensive plugin for [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js) that enables AI agents to autonomously create and manage stablecoins on the Hedera network using the [Stablecoin Studio SDK](https://github.com/hashgraph/stablecoin-studio).

## Features

- **Stablecoin Lifecycle Management**: Create, configure, update, pause, and delete stablecoins
- **Treasury Operations**: Mint (cash-in), burn, wipe, transfer, and rescue operations
- **Access Control**: Role-based permissions with granular control (Admin, CashIn, Burn, Wipe, etc.)
- **Compliance**: KYC management and account freezing capabilities
- **Reserve Management**: Proof of reserve tracking for collateralization
- **Advanced Features**: Hold management (escrow), custom fee configuration
- **Query Tools**: Balance checks, capability discovery, stablecoin listing

### SDK Service Layer (src/service/stablecoin-sdk.service.ts)
Created a singleton service that handles:
Network initialization with Network.init()
Account connection with Network.connect()
Configuration management from environment variables
Support for both testnet and mainnet
Idempotent initialization (safe to call multiple times)

### Plugin Export:
The src/index.ts file exports all 6 tools in a single plugin that satisfies the Hedera Agent Kit Plugin interface. 

### Schemas:
atoms.ts - Common building blocks:
accountIdSchema - Validates Hedera account IDs (0.0.xxxx format)
tokenIdSchema - Validates token IDs
memoSchema - Optional memo field (max 100 chars)
roleSchema - Enum for all role types (ADMIN, CASHIN, BURN, etc.)
supplyTypeSchema - FINITE or INFINITE supply
amountSchema - Positive numbers for token amounts
decimalsSchema - 0-18 decimal places (default 6)
lifecycle.schema.ts - One schema per tool with proper Zod validation

## Installation

```bash
npm install stablecoin-studio-plugin hedera-agent-kit @hashgraph/stablecoin-npm-sdk
```

## Quick Start

### Using with Hedera Agent Kit

```typescript
import { Client } from '@hashgraph/sdk';
import { HederaLangchainToolkit } from 'hedera-agent-kit';
import { stablecoinStudioPlugin } from 'stablecoin-studio-plugin';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(accountId, privateKey);

// Create toolkit with stablecoin plugin
const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [stablecoinStudioPlugin],
  },
});

// Use tools with LangChain agent
const tools = toolkit.tools;
```

### Using with LangChain

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const llm = new ChatOpenAI({ model: 'gpt-4' });

const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a helpful assistant managing stablecoins on Hedera.'],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);

const agent = await createToolCallingAgent({
  llm,
  tools: toolkit.tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools: toolkit.tools,
});

// Run agent
const result = await agentExecutor.invoke({
  input: 'Create a stablecoin called MyUSD with 6 decimals and max supply of 1 million',
});

console.log(result.output);
```

## Available Plugins

The stablecoin-studio-plugin is organized into 7 logical plugin groups:

### 1. Stablecoin Lifecycle Plugin (6 tools)
- `create_stablecoin_tool` - Create new stablecoins
- `get_stablecoin_info_tool` - Get stablecoin details
- `update_stablecoin_tool` - Update token properties
- `pause_stablecoin_tool` - Pause all operations
- `unpause_stablecoin_tool` - Resume operations
- `delete_stablecoin_tool` - Delete stablecoin
<!-- 
### 2. Access Control Plugin (7 tools)
- `grant_role_tool` - Grant operational roles
- `revoke_role_tool` - Revoke roles
- `check_role_tool` - Check role status
- `get_account_roles_tool` - List account roles
- `get_accounts_with_role_tool` - Find accounts with role
- `manage_allowance_tool` - Manage minting allowances
- `get_allowance_tool` - Check allowance

### 3. Compliance Plugin (5 tools)
- `grant_kyc_tool` - Grant KYC status
- `revoke_kyc_tool` - Revoke KYC status
- `check_kyc_tool` - Check KYC status
- `freeze_account_tool` - Freeze account
- `unfreeze_account_tool` - Unfreeze account

### 4. Treasury Plugin (6 tools)
- `cash_in_tool` - Mint and transfer tokens
- `burn_tool` - Burn tokens from treasury
- `wipe_tool` - Wipe tokens from account
- `transfer_tool` - Transfer to multiple recipients
- `rescue_token_tool` - Rescue tokens from contract
- `rescue_hbar_tool` - Rescue HBAR from contract

### 5. Reserve Plugin (2 tools)
- `get_reserve_amount_tool` - Check reserve amount
- `update_reserve_amount_tool` - Update reserve

### 6. Advanced Features Plugin (6 tools)
- `create_hold_tool` - Create token hold (escrow)
- `execute_hold_tool` - Execute hold
- `release_hold_tool` - Release hold
- `add_fixed_fee_tool` - Add fixed transaction fee
- `add_fractional_fee_tool` - Add percentage-based fee
- `update_fee_schedule_tool` - Update fee schedule

### 7. Query Plugin (5 tools)
- `get_balance_tool` - Get token balance
- `list_stablecoins_tool` - List all stablecoins
- `get_capabilities_tool` - Get available operations
- `check_association_tool` - Check token association
- `associate_token_tool` - Associate token -->

## Use Cases

### Treasury Management
```typescript
// AI agent can autonomously manage stablecoin supply
"Monitor the reserve amount and mint 10000 MyUSD tokens if reserve exceeds total supply"
```

### Compliance Automation
```typescript
// Automate KYC workflows
"Grant KYC to account 0.0.123456 and then transfer 1000 tokens"
```

### Access Control
```typescript
// Manage roles and permissions
"Grant the CASHIN role to account 0.0.789 with a limit of 50000 tokens per day"
```

### Security Response
```typescript
// Respond to security events
"Freeze account 0.0.999 immediately and revoke all roles"
```

## Environment Variables

Create a `.env` file in your project:

```bash
# Required
ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
PRIVATE_KEY=your_private_key_here
NETWORK=testnet  # or mainnet

# Optional
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
JSON_RPC_URL=https://testnet.hashio.io/api
OPENAI_API_KEY=your_openai_key  # For LangChain examples using OpenAI
```

## Examples

See the `examples/` directory for complete working examples:


- `stablecoin-studio-sdk-smoke-test.ts` - Smoke test for initializing and connecting with the Stablecoin Studio SDK

Run examples:
```bash
npm install
npx tsx examples/stablecoin-studio-sdk-smoke-test.ts
```

## Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Product Requirements Document](./.windsurf/PRD.md) - Complete feature specification
- [Architecture](./docs/ARCHITECTURE.md) - Plugin architecture details

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Watch mode
npm run dev

# Lint code
npm run lint
```

## Architecture

The plugin follows the Hedera Agent Kit plugin architecture:

```
stablecoin-studio-plugin
├── 7 Plugin Groups
│   ├── Lifecycle, Access Control, Compliance
│   ├── Treasury, Reserve, Advanced, Query
├── 43 Total Tools
├── Service Layer (SDK integration)
├── Parameter Validation (Zod schemas)
└── LangChain Integration
```

## Requirements

- Node.js >= 18.0.0
- Hedera account with HBAR for transaction fees
- Stablecoin Studio SDK access
- LangChain (for AI agent integration)

## License

MIT

## Links

- [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js)
- [Stablecoin Studio](https://github.com/hashgraph/stablecoin-studio)
- [Hedera Documentation](https://docs.hedera.com)
- [LangChain Documentation](https://js.langchain.com)

## Support

- GitHub Issues: [Create an issue](https://github.com/your-repo/stablecoin-studio-plugin/issues)
- Hedera Discord: [Join the community](https://hedera.com/discord)

## Acknowledgments

Built on top of:
- Hedera Agent Kit by Hashgraph
- Stablecoin Studio by Hashgraph
- LangChain for AI orchestration
