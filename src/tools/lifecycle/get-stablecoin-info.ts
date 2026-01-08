
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import {
  StableCoin,
  GetStableCoinDetailsRequest,
} from '@hashgraph/stablecoin-npm-sdk';
import { getStablecoinInfoSchema } from '@/schemas/lifecycle.schema';
import { GET_STABLECOIN_INFO_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

/**
 * Tool constant for getting stablecoin information
 */
export const TOOL_NAME = GET_STABLECOIN_INFO_TOOL;

/**
 * Tool description generator using PromptGenerator
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool retrieves detailed information about a stablecoin token on the Hedera network.

Parameters:
- tokenId (string, required): The Hedera token ID of the stablecoin to query (e.g., "0.0.123456")

Returns:
- tokenId: The token ID
- name: Token name
- symbol: Token symbol
- decimals: Number of decimal places
- totalSupply: Current total supply in base units
- maxSupply: Maximum supply limit (if set)
- treasury: Treasury account ID
- pauseStatus: Whether the token is currently paused
- deleted: Whether the token has been deleted
- keys: Associated permission keys (KYC, Freeze, Wipe, etc.)
- roles: Role assignments for various operations
- reserveAddress: Reserve data feed address (if applicable)
- customFees: Custom fee schedule (if configured)

Important Notes:
- This is a read-only operation and does not require any special permissions
- Returns comprehensive token configuration including all keys and roles
- Use this before performing operations to verify token status

Example Usage:
- Get info: {"tokenId": "0.0.123456"}

${usageInstructions}
`;
};

/**
 * Tool factory function
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Get Stablecoin Info',
  description: toolPrompt(context),
  parameters: getStablecoinInfoSchema(context),

  execute: async (client, context, params) => {
    try {
      // Initialize SDK connection
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      // Get stablecoin details
      const request = new GetStableCoinDetailsRequest({ id: params.tokenId });
      const coinInfo = await StableCoin.getInfo(request);

      // Extract key information
      const result = {
        tokenId: coinInfo.tokenId?.toString() || params.tokenId,
        name: coinInfo.name,
        symbol: coinInfo.symbol,
        decimals: coinInfo.decimals,
        totalSupply: coinInfo.totalSupply?.toString(),
        maxSupply: coinInfo.maxSupply?.toString(),
        initialSupply: coinInfo.initialSupply?.toString(),
        treasury: coinInfo.treasury?.toString(),
        paused: coinInfo.paused,
        deleted: coinInfo.deleted,
        freezeDefault: coinInfo.freezeDefault,
        proxyAddress: coinInfo.proxyAddress?.toString(),
        evmProxyAddress: coinInfo.evmProxyAddress?.toString(),
        reserveAddress: coinInfo.reserveAddress?.toString(),
        reserveAmount: coinInfo.reserveAmount?.toString(),
        keys: {
          adminKey: coinInfo.adminKey?.toString(),
          kycKey: coinInfo.kycKey?.toString(),
          freezeKey: coinInfo.freezeKey?.toString(),
          wipeKey: coinInfo.wipeKey?.toString(),
          supplyKey: coinInfo.supplyKey?.toString(),
          pauseKey: coinInfo.pauseKey?.toString(),
          feeScheduleKey: coinInfo.feeScheduleKey?.toString(),
        },
        expirationTime: coinInfo.expirationTime,
        autoRenewAccount: coinInfo.autoRenewAccount?.toString(),
        autoRenewPeriod: coinInfo.autoRenewPeriod,
        customFees: coinInfo.customFees,
        metadata: coinInfo.metadata,
      };

      const statusText = result.paused ? 'PAUSED' : result.deleted ? 'DELETED' : 'ACTIVE';
      const humanMessage = `Stablecoin ${result.tokenId}: "${result.name}" (${result.symbol}), ${result.decimals} decimals, total supply: ${result.totalSupply}, treasury: ${result.treasury}, status: ${statusText}${result.reserveAddress ? `, reserve: ${result.reserveAddress}` : ''}`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to get stablecoin info: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
