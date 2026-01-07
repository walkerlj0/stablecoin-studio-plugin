# Setup Guide: Stablecoin Studio Plugin

This guide will walk you through setting up the Stablecoin Studio Plugin for Hedera Agent Kit.

## Prerequisites

### 1. Node.js and npm
Ensure you have Node.js 18 or higher installed:

```bash
node --version  # Should be >= 18.0.0
npm --version
```

### 2. Hedera Account

You need a Hedera account with:
- **Account ID** (format: `0.0.123456`)
- **Private Key** (ECDSA or ED25519)
- **HBAR balance** for transaction fees

#### Creating a Hedera Account

**Option A: Hedera Portal (Testnet)**
1. Visit [portal.hedera.com](https://portal.hedera.com)
2. Create a testnet account
3. Save your Account ID and Private Key

**Option B: HashPack Wallet**
1. Install [HashPack](https://www.hashpack.app/)
2. Create a new account
3. Export your private key (Settings → Security)

**Option C: Programmatically**
```typescript
import { Client, PrivateKey, AccountCreateTransaction, Hbar } from '@hashgraph/sdk';

const client = Client.forTestnet();
client.setOperator(operatorId, operatorKey);

const newPrivateKey = PrivateKey.generate();
const newPublicKey = newPrivateKey.publicKey;

const transaction = new AccountCreateTransaction()
  .setKey(newPublicKey)
  .setInitialBalance(new Hbar(10));

const txResponse = await transaction.execute(client);
const receipt = await txResponse.getReceipt(client);
const newAccountId = receipt.accountId;

console.log('New Account ID:', newAccountId.toString());
console.log('Private Key:', newPrivateKey.toString());
```

### 3. OpenAI API Key (Optional)

For LangChain examples with GPT models:
1. Visit [platform.openai.com](https://platform.openai.com/api-keys)
2. Create an API key
3. Save for environment configuration

## Installation

### Step 1: Install the Plugin

```bash
npm install stablecoin-studio-plugin hedera-agent-kit @hashgraph/stablecoin-npm-sdk @hashgraph/sdk
```

### Step 2: Install AI Framework (Optional)

For LangChain integration:
```bash
npm install @langchain/core @langchain/openai langchain
```

For other frameworks:
```bash
# ElizaOS
npm install @elizaos/core

# AI SDK
npm install ai @ai-sdk/openai
```

## Configuration

### Step 1: Create Environment File

Create a `.env` file in your project root:

```bash
# Hedera Network Configuration
NETWORK=testnet
ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
PRIVATE_KEY=your_private_key_here

# Optional: Custom Endpoints
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
JSON_RPC_URL=https://testnet.hashio.io/api

# Optional: AI Model API Keys
OPENAI_API_KEY=sk-...
```

**Security Note:** Never commit `.env` files to version control. Add `.env` to your `.gitignore`.

### Step 2: Load Environment Variables

Install `dotenv`:
```bash
npm install dotenv
```

In your code:
```typescript
import 'dotenv/config';

const accountId = process.env.ACCOUNT_ID!;
const privateKey = process.env.PRIVATE_KEY!;
const network = process.env.NETWORK || 'testnet';
```

## Network Configuration

### Testnet Configuration

```typescript
import { Client } from '@hashgraph/sdk';

const client = Client.forTestnet();
client.setOperator(accountId, privateKey);

// Custom mirror node (optional)
client.setMirrorNetwork(['testnet.mirrornode.hedera.com:443']);
```

**Testnet Details:**
- **Mirror Node:** `https://testnet.mirrornode.hedera.com`
- **JSON-RPC:** `https://testnet.hashio.io/api`
- **Faucet:** [portal.hedera.com](https://portal.hedera.com) (free testnet HBAR)

### Mainnet Configuration

```typescript
const client = Client.forMainnet();
client.setOperator(accountId, privateKey);

// Custom mirror node (optional)
client.setMirrorNetwork(['mainnet-public.mirrornode.hedera.com:443']);
```

**Mainnet Details:**
- **Mirror Node:** `https://mainnet-public.mirrornode.hedera.com`
- **JSON-RPC:** `https://mainnet.hashio.io/api`
- **Explorer:** [HashScan](https://hashscan.io)

## Stablecoin Studio SDK Setup

The Stablecoin Studio SDK requires additional configuration:

### Step 1: Initialize SDK

```typescript
import { initializeFactory, Network } from '@hashgraph/stablecoin-npm-sdk';

// Initialize the factory
await initializeFactory();

// Connect to network
await Network.connect({
  account: {
    accountId: process.env.ACCOUNT_ID!,
    privateKey: process.env.PRIVATE_KEY!,
  },
  network: process.env.NETWORK || 'testnet',
  mirrorNode: {
    url: process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com',
  },
  rpcNode: {
    url: process.env.JSON_RPC_URL || 'https://testnet.hashio.io/api',
  },
});
```

### Step 2: Verify Connection

```typescript
import { Account } from '@hashgraph/stablecoin-npm-sdk';

// Get account info to verify connection
const accountInfo = await Account.getInfo({
  accountId: process.env.ACCOUNT_ID!,
});

console.log('Connected to Hedera!');
console.log('Account:', accountInfo.accountId);
console.log('Balance:', accountInfo.balance, 'HBAR');
```

## Basic Usage Example

### Create Your First Agent

Create `my-stablecoin-agent.ts`:

```typescript
import 'dotenv/config';
import { Client } from '@hashgraph/sdk';
import { HederaLangchainToolkit } from 'hedera-agent-kit';
import { stablecoinStudioPlugin } from 'stablecoin-studio-plugin';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

async function main() {
  // 1. Initialize Hedera client
  const client = Client.forTestnet();
  client.setOperator(
    process.env.ACCOUNT_ID!,
    process.env.PRIVATE_KEY!
  );

  // 2. Create toolkit with stablecoin plugin
  const toolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      plugins: [stablecoinStudioPlugin],
      context: {
        accountId: process.env.ACCOUNT_ID!,
      },
    },
  });

  // 3. Initialize LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // 4. Create prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a stablecoin management assistant. Help users create and manage stablecoins on Hedera.'],
    ['human', '{input}'],
    ['placeholder', '{agent_scratchpad}'],
  ]);

  // 5. Create agent
  const agent = await createToolCallingAgent({
    llm,
    tools: toolkit.tools,
    prompt,
  });

  // 6. Create executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools: toolkit.tools,
    verbose: true,
  });

  // 7. Run agent
  const result = await agentExecutor.invoke({
    input: 'Create a stablecoin called TestUSD with symbol TUSD, 6 decimals, and a max supply of 1 million tokens',
  });

  console.log('\n=== Result ===');
  console.log(result.output);

  // Cleanup
  client.close();
}

main().catch(console.error);
```

### Run the Agent

```bash
npx tsx my-stablecoin-agent.ts
```

## Testing Your Setup

### Test 1: Create a Stablecoin

```typescript
import { stablecoinStudioPlugin } from 'stablecoin-studio-plugin';

const createTool = stablecoinStudioPlugin.tools(context).find(
  t => t.method === 'create_stablecoin_tool'
);

const result = await createTool.execute(client, context, {
  name: 'Test Stablecoin',
  symbol: 'TEST',
  decimals: 6,
  initialSupply: 0,
  maxSupply: 1000000,
});

console.log('Created stablecoin:', result);
```

### Test 2: Query Stablecoin Info

```typescript
const getInfoTool = stablecoinStudioPlugin.tools(context).find(
  t => t.method === 'get_stablecoin_info_tool'
);

const info = await getInfoTool.execute(client, context, {
  tokenId: '0.0.123456',
});

console.log('Stablecoin info:', info);
```

### Test 3: List Your Stablecoins

```typescript
const listTool = stablecoinStudioPlugin.tools(context).find(
  t => t.method === 'list_stablecoins_tool'
);

const stablecoins = await listTool.execute(client, context, {
  accountId: process.env.ACCOUNT_ID,
});

console.log('Your stablecoins:', stablecoins);
```

## Troubleshooting

### Issue: "SDK initialization failed"

**Solution:** Ensure Stablecoin Studio SDK is properly initialized:
```typescript
import { initializeFactory, Network } from '@hashgraph/stablecoin-npm-sdk';

await initializeFactory();
await Network.connect({ /* config */ });
```

### Issue: "Insufficient permissions"

**Solution:** Grant your account the necessary role:
```typescript
// Use an admin account to grant roles
const grantRoleTool = stablecoinStudioPlugin.tools(context).find(
  t => t.method === 'grant_role_tool'
);

await grantRoleTool.execute(client, context, {
  tokenId: '0.0.123456',
  targetAccount: process.env.ACCOUNT_ID,
  role: 'CASHIN',
});
```

### Issue: "Insufficient HBAR balance"

**Solution:**
- **Testnet:** Get free HBAR from [portal.hedera.com](https://portal.hedera.com)
- **Mainnet:** Purchase HBAR from an exchange and transfer to your account

### Issue: "Network timeout"

**Solution:** Check network configuration and retry:
```typescript
// Increase timeout
const client = Client.forTestnet();
client.setRequestTimeout(60000); // 60 seconds
```

### Issue: "Token not found"

**Solution:** Verify token ID format and existence:
```bash
# Check on HashScan
https://hashscan.io/testnet/token/0.0.123456
```

## Best Practices

### 1. Key Management

**Development:**
```typescript
// Load from .env file
import 'dotenv/config';
const privateKey = process.env.PRIVATE_KEY!;
```

**Production:**
```typescript
// Use environment variables or secrets manager
const privateKey = process.env.PRIVATE_KEY!;

// Or use AWS KMS, HashiCorp Vault, etc.
```

### 2. Error Handling

```typescript
try {
  const result = await tool.execute(client, context, params);
  console.log('Success:', result);
} catch (error) {
  if (error.code === 'INSUFFICIENT_PERMISSIONS') {
    console.error('Need to grant role first');
  } else if (error.code === 'TOKEN_NOT_FOUND') {
    console.error('Invalid token ID');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 3. Rate Limiting

Hedera has rate limits. Implement retry logic:

```typescript
async function executeWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 4. Context Management

```typescript
const context = {
  accountId: process.env.ACCOUNT_ID!,
  mode: 'AUTONOMOUS', // or 'RETURN_BYTES'
};

// Pass context to all tool executions
await tool.execute(client, context, params);
```

## Next Steps

1. **Explore Examples:** Check the `examples/` directory for complete use cases
2. **Read the PRD:** See `.windsurf/PRD.md` for complete feature documentation
3. **Build Your Agent:** Create custom agents for your specific use cases
4. **Join Community:** Connect with other developers on [Hedera Discord](https://hedera.com/discord)

## Additional Resources

- [Hedera Documentation](https://docs.hedera.com)
- [Stablecoin Studio Docs](https://docs.hedera.com/stablecoin-studio)
- [Hedera Agent Kit Docs](https://github.com/hashgraph/hedera-agent-kit-js)
- [LangChain Docs](https://js.langchain.com)
- [Hedera SDKs](https://docs.hedera.com/hedera/sdks-and-apis)

## Support

- **GitHub Issues:** Report bugs and request features
- **Hedera Discord:** Get help from the community
- **Stack Overflow:** Tag questions with `hedera` and `stablecoin`

---

You're now ready to build AI agents that can autonomously manage stablecoins on Hedera!
