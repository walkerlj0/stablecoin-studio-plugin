
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import {
  StableCoin,
  UpdateRequest,
} from '@hashgraph/stablecoin-npm-sdk';
import { updateStablecoinSchema } from '@/schemas/lifecycle.schema';
import { UPDATE_STABLECOIN_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

/**
 * Tool constant for updating stablecoin properties
 */
export const TOOL_NAME = UPDATE_STABLECOIN_TOOL;

/**
 * Tool description generator using PromptGenerator
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool updates mutable properties of a stablecoin token on the Hedera network.

Parameters:
- tokenId (string, required): The Hedera token ID of the stablecoin to update
- name (string, optional): New token name
- symbol (string, optional): New token symbol
- memo (string, optional): New token memo

Returns:
- tokenId: The updated token ID
- transactionId: The Hedera transaction ID
- updatedFields: List of fields that were updated

Important Notes:
- Only the admin key holder can update token properties
- At least one field (name, symbol, or memo) must be provided
- Not all token properties are mutable (e.g., decimals, supply type cannot be changed)
- The update is atomic - either all changes succeed or all fail

Example Usage:
- Update name: {"tokenId": "0.0.123456", "name": "New Token Name"}
- Update symbol: {"tokenId": "0.0.123456", "symbol": "NEW"}
- Update multiple: {"tokenId": "0.0.123456", "name": "New Name", "symbol": "NEW", "memo": "Updated"}

${usageInstructions}
`;
};

/**
 * Tool factory function
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Update Stablecoin',
  description: toolPrompt(context),
  parameters: updateStablecoinSchema(context),

  execute: async (client, context, params) => {
    try {
      // Initialize SDK connection
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      // Track which fields are being updated
      const updatedFields: string[] = [];
      if (params.name) updatedFields.push('name');
      if (params.symbol) updatedFields.push('symbol');
      if (params.memo) updatedFields.push('metadata');

      if (updatedFields.length === 0) {
        return {
          raw: { error: 'No fields to update' },
          humanMessage:
            'No fields provided for update. Please specify at least one field to update (name, symbol, or memo).',
        };
      }

      // Build UpdateRequest with provided fields
      const updateRequest = new UpdateRequest({
        tokenId: params.tokenId,
        name: params.name,
        symbol: params.symbol,
        metadata: params.memo,
      });

      // Execute the update
      const success = await StableCoin.update(updateRequest);

      if (!success) {
        throw new Error('Update operation returned false');
      }

      const result = {
        tokenId: params.tokenId,
        success,
        updatedFields,
        newValues: {
          name: params.name,
          symbol: params.symbol,
          metadata: params.memo,
        },
      };

      const humanMessage = `Successfully updated stablecoin ${params.tokenId}. Updated fields: ${updatedFields.join(', ')}`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to update stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
