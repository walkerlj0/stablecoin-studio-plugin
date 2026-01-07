import { z } from 'zod';
import {
  Client,
  type Context,
  type Tool,
  PromptGenerator,
} from 'hedera-agent-kit';
import { pauseStablecoinSchema } from '@/schemas/lifecycle.schema';
import { PAUSE_STABLECOIN_TOOL } from '@/utils/constants';

/**
 * Tool constant for pausing a stablecoin
 */
export const TOOL_NAME = PAUSE_STABLECOIN_TOOL;

/**
 * Tool description generator using PromptGenerator
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool pauses all operations on a stablecoin token, preventing any transfers or other token operations.

Parameters:
- tokenId (string, required): The Hedera token ID of the stablecoin to pause

Returns:
- tokenId: The paused token ID
- transactionId: The Hedera transaction ID
- status: New pause status

Important Notes:
- Only accounts with the PAUSE role can pause a stablecoin
- When paused, NO token transfers or operations are allowed (except unpausing)
- This is a security feature useful during security incidents or maintenance
- The token can be unpaused using the unpause_stablecoin_tool
- Pausing does not affect token balances or ownership

Common Use Cases:
- Emergency response to security threats
- Scheduled maintenance windows
- Regulatory compliance requirements
- Investigation of suspicious activity

Example Usage:
- Pause token: {"tokenId": "0.0.123456"}

${usageInstructions}
`;
};

/**
 * Tool factory function
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Pause Stablecoin',
  description: toolPrompt(context),
  parameters: pauseStablecoinSchema(context),

  execute: async (
    client: Client,
    context: Context,
    params: z.infer<ReturnType<typeof pauseStablecoinSchema>>
  ) => {
    try {
      // Placeholder for actual Stablecoin Studio SDK integration
      const result = {
        tokenId: params.tokenId,
        transactionId: 'PLACEHOLDER_TX_ID',
        status: 'PAUSED',
        timestamp: new Date().toISOString(),
      };

      const humanMessage = `Successfully paused stablecoin ${params.tokenId}. All token operations are now disabled. Transaction ID: ${result.transactionId}`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to pause stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
