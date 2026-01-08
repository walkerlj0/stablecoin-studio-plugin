
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import {
  StableCoin,
  DeleteRequest,
} from '@hashgraph/stablecoin-npm-sdk';
import { deleteStablecoinSchema } from '@/schemas/lifecycle.schema';
import { DELETE_STABLECOIN_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

/**
 * Tool constant for deleting a stablecoin
 */
export const TOOL_NAME = DELETE_STABLECOIN_TOOL;

/**
 * Tool description generator using PromptGenerator
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool permanently deletes a stablecoin token from the Hedera network. This operation is IRREVERSIBLE.

Parameters:
- tokenId (string, required): The Hedera token ID of the stablecoin to permanently delete

Returns:
- tokenId: The deleted token ID
- transactionId: The Hedera transaction ID
- status: Confirmation of deletion

Important Notes:
- This is a PERMANENT and IRREVERSIBLE operation
- Only accounts with the DELETE role can delete a stablecoin
- All token balances must be zero before deletion
- The treasury must hold zero balance
- All associated accounts must be dissociated or have zero balance
- The token cannot be recovered after deletion
- Use with extreme caution

Prerequisites:
1. Total supply must be zero (burn all tokens first)
2. All non-treasury accounts must have zero balance
3. Treasury account must have zero balance
4. Caller must have DELETE role

Safety Recommendations:
- Always pause the token before deletion
- Verify all balances are zero using get_stablecoin_info_tool
- Confirm this action with stakeholders
- Document the deletion reason

Example Usage:
- Delete token: {"tokenId": "0.0.123456"}

${usageInstructions}
`;
};

/**
 * Tool factory function
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Delete Stablecoin',
  description: toolPrompt(context),
  parameters: deleteStablecoinSchema(context),

  execute: async (client, context, params) => {
    try {
      // Initialize SDK connection
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      // Create delete request
      const deleteRequest = new DeleteRequest({
        tokenId: params.tokenId,
      });

      // Execute the delete operation
      const success = await StableCoin.delete(deleteRequest);

      if (!success) {
        throw new Error('Delete operation returned false');
      }

      const result = {
        tokenId: params.tokenId,
        success,
        status: 'DELETED',
        timestamp: new Date().toISOString(),
      };

      const humanMessage = `Successfully deleted stablecoin ${params.tokenId}. This operation is permanent and cannot be reversed.`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to delete stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
