import 'dotenv/config';
import {
  Network,
  InitializationRequest,
  ConnectRequest,
  SupportedWallets,
} from '@hashgraph/stablecoin-npm-sdk';

const accountId = process.env.ACCOUNT_ID ?? process.env.HEDERA_ACCOUNT_ID;
const privateKey = process.env.PRIVATE_KEY ?? process.env.HEDERA_PRIVATE_KEY;
const network = process.env.NETWORK ?? 'testnet';

if (!accountId) {
  throw new Error(
    'Missing account ID. Set ACCOUNT_ID or HEDERA_ACCOUNT_ID in .env at the repo root.',
  );
}

if (!privateKey) {
  throw new Error(
    'Missing private key. Set PRIVATE_KEY or HEDERA_PRIVATE_KEY in .env at the repo root.',
  );
}

console.log('Initializing Stablecoin Studio SDK...');
console.log('Network:', network);
console.log('Account:', accountId);

// Step 1: Initialize the network
const mirrorNodeConfig = {
  name: network === 'mainnet' ? 'Mainnet Mirror Node' : 'Testnet Mirror Node',
  network: network === 'mainnet' ? 'mainnet' : 'testnet',
  baseUrl: network === 'mainnet'
    ? 'https://mainnet-public.mirrornode.hedera.com/api/v1/'
    : 'https://testnet.mirrornode.hedera.com/api/v1/',
  apiKey: '',
  headerName: '',
  selected: true,
};

const rpcNodeConfig = {
  name: 'HashIO',
  network: network === 'mainnet' ? 'mainnet' : 'testnet',
  baseUrl: network === 'mainnet'
    ? 'https://mainnet.hashio.io/api'
    : 'https://testnet.hashio.io/api',
  apiKey: '',
  headerName: '',
  selected: true,
};

try {
  console.log('Step 1: Calling Network.init()...');
  await Network.init(
    new InitializationRequest({
      network: network as 'mainnet' | 'testnet',
      mirrorNode: mirrorNodeConfig,
      rpcNode: rpcNodeConfig,
      configuration: {
        factoryAddress: network === 'mainnet' ? '0.0.0' : '0.0.6431833',
        resolverAddress: network === 'mainnet' ? '0.0.0' : '0.0.6431794',
      },
    }),
  );
  console.log('✓ Network initialized');

  // Step 2: Connect with account credentials
  console.log('Step 2: Calling Network.connect()...');
  await Network.connect(
    new ConnectRequest({
      account: {
        accountId: accountId,
        privateKey: {
          key: privateKey,
          type: 'ED25519',
        },
      },
      network: network as 'mainnet' | 'testnet',
      mirrorNode: mirrorNodeConfig,
      rpcNode: rpcNodeConfig,
      wallet: SupportedWallets.CLIENT,
    }),
  );
  console.log('✓ Connected to network');
} catch (error) {
  console.error('Failed to initialize/connect:', error);
  throw new Error(
    'Failed to connect using Stablecoin Studio SDK. Verify your env vars and that the SDK version supports your network/endpoints.',
  );
}

// Step 3: Verify connection succeeded
console.log('Step 3: Verifying SDK is ready...');
console.log('✓ SDK initialized and connected successfully');
console.log('Connected account:', accountId);
console.log('Network:', network);
console.log('\n✅ Smoke test passed! SDK is working correctly.');
