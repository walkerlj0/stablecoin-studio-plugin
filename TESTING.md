# Testing

## Smoke test (Stablecoin Studio SDK)

1. Set env variables:
   - `MY_ACCOUNT_ID`
   - `MY_PRIVATE_KEY` (ECDSA)
2. Run:

```bash
npx tsx examples/stablecoin-studio-sdk-smoke-test.ts
```

## Agent + plugin example (LangChain)

> Note: currently **only** `stablecoin_get_stablecoin_info` is working in this example.

1. Build the plugin:

```bash
npm run build
```

2. Install deps and run the agent:

```bash
cd examples/langchain-v1
npm install
npm run langchain:plugin-tool-calling-agent
```

3. Example input:

`get stablecoin info for token 0.0.4395475`

## Note

To make it work fully with Hedera Agent Kit, we need to find a way to initialize the StableCoinStudioSDK **without providing the private key**.

