import 'dotenv/config';

const sdk = (await import('@hashgraph/stablecoin-npm-sdk')) as unknown as Record<
  string,
  unknown
>;

const Account = sdk.Account as any;
const Network = sdk.Network as any;
const initializeFactory = sdk.initializeFactory as any;

const accountId = process.env.ACCOUNT_ID ?? process.env.HEDERA_ACCOUNT_ID;
const privateKey = process.env.PRIVATE_KEY ?? process.env.HEDERA_PRIVATE_KEY;
const network = process.env.NETWORK ?? 'testnet';
const mirrorNodeUrl =
  process.env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com';
const jsonRpcUrl = process.env.JSON_RPC_URL ?? 'https://testnet.hashio.io/api';

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

if (typeof initializeFactory === 'function') {
  await initializeFactory();
}

const connectArgsVariants = [
  {
    account: { accountId, privateKey },
    network,
    mirrorNode: { url: mirrorNodeUrl },
    rpcNode: { url: jsonRpcUrl },
  },
  {
    account: { accountId, privateKey },
    network,
    mirrorNode: mirrorNodeUrl,
    rpcNode: jsonRpcUrl,
  },
  {
    account: { accountId, privateKey },
    network,
    mirrorNodeUrl,
    jsonRpcUrl,
  },
  {
    account: { accountId, privateKey },
    network,
    mirrorNode: { baseUrl: mirrorNodeUrl },
    rpcNode: { baseUrl: jsonRpcUrl },
  },
];

let connected = false;
if (Network?.connect && typeof Network.connect === 'function') {
  for (const args of connectArgsVariants) {
    try {
      await Network.connect(args as any);
      connected = true;
      break;
    } catch {
      // try next variant
    }
  }
}

if (!connected) {
  throw new Error(
    'Failed to connect using Stablecoin Studio SDK. Verify your env vars and that the SDK version supports your network/endpoints.',
  );
}

const getInfoArgsVariants = [{ accountId }, { account: accountId }, { id: accountId }];

let accountInfo: unknown;
if (Account?.getInfo && typeof Account.getInfo === 'function') {
  for (const args of getInfoArgsVariants) {
    try {
      accountInfo = await Account.getInfo(args as any);
      break;
    } catch {
      // try next variant
    }
  }
}

if (!accountInfo) {
  throw new Error(
    'Connected, but failed to fetch account info via Stablecoin Studio SDK. The Account.getInfo request shape may have changed.',
  );
}

console.log('Connected to Hedera via Stablecoin Studio SDK');
console.log('Account info:', accountInfo);
