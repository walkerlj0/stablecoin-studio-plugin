import { z } from 'zod';
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import { unpauseStablecoinSchema } from '@/schemas/lifecycle.schema';
import { UNPAUSE_STABLECOIN_TOOL } from '@/utils/constants';

/**
 * Tool constant for unpausing a stablecoin
 */
export const TOOL_NAME = UNPAUSE_STABLECOIN_TOOL;

/**
 * Tool description generator using PromptGenerator
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool resumes operations on a previously paused stablecoin token, allowing transfers and other operations.

Parameters:
- tokenId (string, required): The Hedera token ID of the stablecoin to unpause

Returns:
- tokenId: The unpaused token ID
- transactionId: The Hedera transaction ID
- status: New pause status

Important Notes:
- Only accounts with the PAUSE role can unpause a stablecoin
- After unpausing, all normal token operations are restored
- Unpausing does not affect other restrictions (e.g., frozen accounts remain frozen)
- This operation only succeeds if the token is currently paused

Common Use Cases:
- Resuming operations after security incident resolution
- Completing scheduled maintenance
- Restoring service after compliance review

Example Usage:
- Unpause token: {"tokenId": "0.0.123456"}

${usageInstructions}
`;
};

/**
 * Tool factory function
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Unpause Stablecoin',
  description: toolPrompt(context),
  parameters: unpauseStablecoinSchema(context),

  execute: async (_client, _context, params) => {
    try {
      // Placeholder for actual Stablecoin Studio SDK integration
      const result = {
        tokenId: params.tokenId,
        transactionId: 'PLACEHOLDER_TX_ID',
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
      };

      const humanMessage = `Successfully unpaused stablecoin ${params.tokenId}. Token operations are now enabled. Transaction ID: ${result.transactionId}`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to unpause stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
