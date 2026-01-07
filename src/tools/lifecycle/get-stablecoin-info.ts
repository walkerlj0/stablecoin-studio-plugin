import { z } from 'zod';
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import { getStablecoinInfoSchema } from '@/schemas/lifecycle.schema';
import { GET_STABLECOIN_INFO_TOOL } from '@/utils/constants';

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

  execute: async (_client, _context, params) => {
    try {
      // Placeholder for actual Stablecoin Studio SDK integration
      const result = {
        tokenId: params.tokenId,
        name: 'Placeholder Stablecoin',
        symbol: 'PLACEHOLDER',
        decimals: 6,
        totalSupply: '0',
        maxSupply: undefined,
        treasury: '0.0.TREASURY',
        pauseStatus: false,
        deleted: false,
        keys: {
          kycKey: '0.0.OPERATOR',
          freezeKey: '0.0.OPERATOR',
          wipeKey: '0.0.OPERATOR',
          pauseKey: '0.0.OPERATOR',
          feeScheduleKey: '0.0.OPERATOR',
        },
        roles: [],
        reserveAddress: undefined,
        customFees: [],
      };

      const humanMessage = `Stablecoin ${params.tokenId}: "${result.name}" (${result.symbol}), ${result.decimals} decimals, total supply: ${result.totalSupply}, treasury: ${result.treasury}, ${result.pauseStatus ? 'PAUSED' : 'ACTIVE'}`;

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
