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

This tool retrieves comprehensive information about a stablecoin token on the Hedera network.

Parameters:
- tokenId (string, required): The Hedera token ID of the stablecoin to query (e.g., "0.0.123456")

Returns:
- tokenId: The token ID
- name: Token name
- symbol: Token symbol
- decimals: Number of decimal places
- totalSupply: Current total supply in base units
- maxSupply: Maximum supply limit (if set, null for infinite)
- initialSupply: Initial supply when token was created
- treasury: Treasury account ID that holds the token supply
- paused: Whether the token is currently paused
- deleted: Whether the token has been deleted
- freezeDefault: Whether accounts are frozen by default
- proxyAddress: Smart contract proxy address (Hedera format)
- evmProxyAddress: EVM-compatible proxy address (0x format)
- reserveAddress: Reserve data feed address (if proof of reserve enabled)
- reserveAmount: Current reserve amount backing the token
- keys: Object containing all permission keys:
  - adminKey: Admin key for token configuration
  - kycKey: KYC key for Know Your Customer operations
  - freezeKey: Freeze key for freezing accounts
  - wipeKey: Wipe key for removing tokens from accounts
  - supplyKey: Supply key for minting/burning tokens
  - pauseKey: Pause key for pausing token operations
  - feeScheduleKey: Fee schedule key for custom fees
- expirationTime: Token expiration timestamp (if set)
- autoRenewAccount: Account that pays for auto-renewal
- autoRenewPeriod: Auto-renewal period in seconds
- customFees: Custom fee schedule configuration (if any)
- metadata: Token metadata/memo

Important Notes:
- This is a read-only operation and does not require any special permissions
- Returns comprehensive token configuration including all keys and roles
- Use this before performing operations to verify token status and configuration
- All supply values are returned as strings in base units (accounting for decimals)

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
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context, false);

      const request = new GetStableCoinDetailsRequest({
        id: params.tokenId,
      });

      const coinInfo = await StableCoin.getInfo(request);

      const result = {
        tokenId: coinInfo.tokenId?.toString() || params.tokenId,
        name: coinInfo.name || null,
        symbol: coinInfo.symbol || null,
        decimals: coinInfo.decimals ?? null,
        totalSupply: coinInfo.totalSupply?.toString() || null,
        maxSupply: coinInfo.maxSupply?.toString() || null,
        initialSupply: coinInfo.initialSupply?.toString() || null,
        treasury: coinInfo.treasury?.toString() || null,
        paused: coinInfo.paused ?? false,
        deleted: coinInfo.deleted ?? false,
        freezeDefault: coinInfo.freezeDefault ?? false,
        proxyAddress: coinInfo.proxyAddress?.toString() || null,
        evmProxyAddress: coinInfo.evmProxyAddress?.toString() || null,
        reserveAddress: coinInfo.reserveAddress?.toString() || null,
        reserveAmount: coinInfo.reserveAmount?.toString() || null,
        keys: {
          adminKey: coinInfo.adminKey?.toString() || null,
          kycKey: coinInfo.kycKey?.toString() || null,
          freezeKey: coinInfo.freezeKey?.toString() || null,
          wipeKey: coinInfo.wipeKey?.toString() || null,
          supplyKey: coinInfo.supplyKey?.toString() || null,
          pauseKey: coinInfo.pauseKey?.toString() || null,
          feeScheduleKey: coinInfo.feeScheduleKey?.toString() || null,
        },
        expirationTime: coinInfo.expirationTime || null,
        autoRenewAccount: coinInfo.autoRenewAccount?.toString() || null,
        autoRenewPeriod: coinInfo.autoRenewPeriod || null,
        customFees: coinInfo.customFees || null,
        metadata: coinInfo.metadata || null,
      };

      const statusParts: string[] = [];
      if (result.paused) statusParts.push('PAUSED');
      if (result.deleted) statusParts.push('DELETED');
      if (statusParts.length === 0) statusParts.push('ACTIVE');
      const statusText = statusParts.join(' / ');

      const supplyInfo = result.maxSupply
        ? `${result.totalSupply} / ${result.maxSupply} max`
        : result.totalSupply || '0';

      let humanMessage = `Stablecoin ${result.tokenId}: "${result.name}" (${result.symbol})\n`;
      humanMessage += `  Decimals: ${result.decimals}\n`;
      humanMessage += `  Total Supply: ${supplyInfo}\n`;
      humanMessage += `  Treasury: ${result.treasury}\n`;
      humanMessage += `  Status: ${statusText}\n`;

      if (result.proxyAddress) {
        humanMessage += `  Proxy Address: ${result.proxyAddress}\n`;
      }
      if (result.evmProxyAddress) {
        humanMessage += `  EVM Proxy: ${result.evmProxyAddress}\n`;
      }
      if (result.reserveAddress) {
        humanMessage += `  Reserve Address: ${result.reserveAddress}\n`;
        if (result.reserveAmount) {
          humanMessage += `  Reserve Amount: ${result.reserveAmount}\n`;
        }
      }
      if (result.metadata) {
        humanMessage += `  Metadata: ${result.metadata}\n`;
      }

      return {
        raw: result,
        humanMessage: humanMessage.trim(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const message = `Failed to get stablecoin info for token ${params.tokenId}: ${errorMessage}`;

      return {
        raw: { error: message, tokenId: params.tokenId },
        humanMessage: message,
      };
    }
  },
});
