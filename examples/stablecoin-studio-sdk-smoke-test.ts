/**
 * Stablecoin Studio SDK - Proof of Concept Script
 *
 * This script demonstrates how to create a stablecoin using the SDK.
 */

import { createRequire } from 'module';
import * as dotenv from 'dotenv';

dotenv.config();

// The Stablecoin SDK package's ESM build has extensionless imports that Node won't resolve.
// `tsx` can sometimes still run it, but to keep this example reliable we load the CJS entry via `require`.
const require = createRequire(import.meta.url);
const {
  Network,
  InitializationRequest,
  CreateRequest,
  ConnectRequest,
  SupportedWallets,
  TokenSupplyType,
  StableCoin,
  AssociateTokenRequest,
  GetAccountBalanceRequest,
  CashInRequest,
} = require('@hashgraph/stablecoin-npm-sdk') as typeof import('@hashgraph/stablecoin-npm-sdk');

// ============================================
// CONFIG
// ============================================

const NETWORK = 'testnet';

const RPC_URL = process.env.RPC_URL || 'https://testnet.hashio.io/api';
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0.0.7353542';
const RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS || '0.0.7353500';

const mirrorNodeConfig = {
  name: 'Testnet Mirror Node',
  network: NETWORK,
  baseUrl: 'https://testnet.mirrornode.hedera.com/api/v1/',
  apiKey: '',
  headerName: '',
  selected: true,
};

const rpcNodeConfig = {
  name: 'HashIO',
  network: NETWORK,
  baseUrl: RPC_URL,
  apiKey: '',
  headerName: '',
  selected: true,
};

const factoryConfig = {
  factoryAddress: FACTORY_ADDRESS,
  resolverAddress: RESOLVER_ADDRESS,
};

// ============================================
// MAIN SCRIPT
// ============================================

async function main(): Promise<void> {
  console.log('🚀 Stablecoin Studio SDK - PoC Script\n');

  // Validate environment variables
  if (!process.env.MY_ACCOUNT_ID || !process.env.MY_PRIVATE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('Please set MY_ACCOUNT_ID and MY_PRIVATE_KEY in your .env file');
    process.exit(1);
  }

  const keyType = process.env.MY_KEY_TYPE || 'ECDSA';

  const account = {
    accountId: process.env.MY_ACCOUNT_ID,
    privateKey: {
      key: process.env.MY_PRIVATE_KEY,
      type: keyType,
    },
  };

  try {
    // ----------------------------------------
    // Step 1: Initialize the Network
    // ----------------------------------------
    console.log('📡 Step 1: Initializing network...');

    await Network.init(
      new InitializationRequest({
        network: NETWORK,
        mirrorNode: mirrorNodeConfig,
        rpcNode: rpcNodeConfig,
        configuration: factoryConfig,
      })
    );

    console.log('✅ Network initialized\n');

    // ----------------------------------------
    // Step 2: Connect to the Network
    // ----------------------------------------
    console.log('🔗 Step 2: Connecting to network...');

    await Network.connect(
      new ConnectRequest({
        account: account,
        network: NETWORK,
        mirrorNode: mirrorNodeConfig,
        rpcNode: rpcNodeConfig,
        wallet: SupportedWallets.CLIENT,
      })
    );

    console.log(`✅ Connected with account: ${account.accountId}\n`);

    // ----------------------------------------
    // Step 3: Create the Stablecoin
    // ----------------------------------------
    console.log('🪙 Step 3: Creating stablecoin...');

    const createRequest = new CreateRequest({
      // Basic token properties
      name: 'My Demo Stablecoin',
      symbol: 'DEMO',
      decimals: 6,
      initialSupply: '1000', // Initial supply of 1000 tokens

      // Token keys - omit to disable these features entirely
      // Setting to 'null' still creates the key in a disabled state which can cause issues
      // freezeKey, kycKey, wipeKey, pauseKey, feeScheduleKey - all omitted to disable

      // Supply configuration
      supplyType: TokenSupplyType.INFINITE, // Or FINITE with maxSupply
      // maxSupply: '1000000', // Uncomment for FINITE supply

      // Reserve configuration (optional)
      createReserve: false,

      // Role assignments - assign all roles to our account
      burnRoleAccount: account.accountId,
      wipeRoleAccount: account.accountId,
      rescueRoleAccount: account.accountId,
      pauseRoleAccount: account.accountId,
      freezeRoleAccount: account.accountId,
      deleteRoleAccount: account.accountId,
      kycRoleAccount: account.accountId,
      cashInRoleAccount: account.accountId,
      feeRoleAccount: account.accountId,

      // Unlimited cash-in allowance (0 = unlimited)
      cashInRoleAllowance: '0',

      // Proxy admin
      proxyOwnerAccount: account.accountId,

      // Configuration IDs (required)
      configId: '0x0000000000000000000000000000000000000000000000000000000000000002',
      configVersion: 1,
    });

    const stableCoin = await StableCoin.create(createRequest);

    const tokenId = stableCoin?.coin?.tokenId?.toString();
    console.log('✅ Stablecoin created!');
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Name: ${stableCoin?.coin?.name}`);
    console.log(`   Symbol: ${stableCoin?.coin?.symbol}`);
    console.log(`   Decimals: ${stableCoin?.coin?.decimals}`);
    console.log(`   Treasury: ${stableCoin?.coin?.treasury}\n`);

    // ----------------------------------------
    // Step 4: Associate Token (if needed)
    // ----------------------------------------
    console.log('🔗 Step 4: Associating token with account...');

    try {
      await StableCoin.associate(
        new AssociateTokenRequest({
          targetId: account.accountId,
          tokenId: tokenId!,
        })
      );
      console.log('✅ Token associated\n');
    } catch {
      // Token might already be associated
      console.log('ℹ️  Token already associated or auto-associated\n');
    }

    // ----------------------------------------
    // Step 5: Check Balance
    // ----------------------------------------
    console.log('💰 Step 5: Checking balance...');

    // Wait a moment for the network to update
    await sleep(3000);

    const balance = await StableCoin.getBalanceOf(
      new GetAccountBalanceRequest({
        tokenId: tokenId!,
        targetId: account.accountId,
      })
    );

    console.log(`✅ Current balance: ${balance.value.toString()} ${stableCoin?.coin?.symbol}\n`);

    // ----------------------------------------
    // Step 6: Mint Additional Tokens (Cash-In)
    // ----------------------------------------
    console.log('💵 Step 6: Minting additional tokens...');

    await StableCoin.cashIn(
      new CashInRequest({
        amount: '500',
        tokenId: tokenId!,
        targetId: account.accountId,
      })
    );

    console.log('✅ Minted 500 additional tokens\n');

    // ----------------------------------------
    // Step 7: Check Updated Balance
    // ----------------------------------------
    console.log('💰 Step 7: Checking updated balance...');

    await sleep(3000);

    const newBalance = await StableCoin.getBalanceOf(
      new GetAccountBalanceRequest({
        tokenId: tokenId!,
        targetId: account.accountId,
      })
    );

    console.log(`✅ Updated balance: ${newBalance.value.toString()} ${stableCoin?.coin?.symbol}\n`);

    // ----------------------------------------
    // Summary
    // ----------------------------------------
    console.log('═══════════════════════════════════════════');
    console.log('🎉 SUCCESS! Stablecoin created and configured');
    console.log('═══════════════════════════════════════════');
    console.log(`Token ID: ${tokenId}`);
    console.log(`View on HashScan: https://hashscan.io/testnet/token/${tokenId}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error: unknown) {
    const err = error as { message?: string; transactionId?: string };
    console.error('❌ Error:', err.message || error);
    if (err.transactionId) {
      console.error(`   Transaction ID: ${err.transactionId}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
main().catch(console.error);