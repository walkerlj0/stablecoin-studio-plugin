import { z } from 'zod';
import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import { createStablecoinSchema } from '@/schemas/lifecycle.schema';
import { CREATE_STABLECOIN_TOOL } from '@/utils/constants';

/**
 * Tool constant for creating a stablecoin
 */
export const TOOL_NAME = CREATE_STABLECOIN_TOOL;

/**
 * Tool description generator using PromptGenerator
 */
const toolPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool creates a new stablecoin token on the Hedera network with customizable properties and permissions.

Parameters:
- name (string, required): The human-readable name of the stablecoin (e.g., "MyUSD Stablecoin")
- symbol (string, required): The token symbol used for trading (e.g., "MUSDC")
- decimals (number, optional, default: 6): Number of decimal places (0-18). Most stablecoins use 6 decimals
- initialSupply (number, optional, default: 0): Initial supply in base units. Use 0 to mint later
- maxSupply (number, optional): Maximum supply limit in base units. Omit for unlimited supply
- supplyType (enum, optional): "FINITE" for limited supply or "INFINITE" for unlimited supply
- proofOfReserve (boolean, optional, default: false): Enable reserve tracking for collateralization
- memo (string, optional): Token memo (max 100 characters)
- kycKey (string, optional): Account ID to control KYC operations
- freezeKey (string, optional): Account ID to control freeze operations
- wipeKey (string, optional): Account ID to control wipe operations
- pauseKey (string, optional): Account ID to control pause operations
- feeScheduleKey (string, optional): Account ID to control custom fee operations

Returns:
- tokenId: The newly created stablecoin's token ID
- proxyAddress: Smart contract proxy address (if applicable)
- reserveAddress: Reserve data feed address (if proofOfReserve enabled)
- transactionId: The Hedera transaction ID

Important Notes:
- The operator account will be set as the treasury and admin by default
- If maxSupply is specified, supplyType is automatically set to FINITE
- Keys default to the operator's account if not specified
- Proof of reserve creates an additional data feed contract for collateral tracking

Example Usage:
- Simple stablecoin: {"name": "MyUSD", "symbol": "MUSD", "decimals": 6}
- With max supply: {"name": "Limited Token", "symbol": "LTD", "maxSupply": 1000000000000, "supplyType": "FINITE"}
- With reserve tracking: {"name": "Backed USD", "symbol": "BUSD", "proofOfReserve": true}

${usageInstructions}
`;
};

/**
 * Tool factory function
 */
export default (context: Context): Tool => ({
  method: TOOL_NAME,
  name: 'Create Stablecoin',
  description: toolPrompt(context),
  parameters: createStablecoinSchema(context),

  execute: async (_client, _context, params) => {
    try {
      // Note: This is a placeholder for actual Stablecoin Studio SDK integration
      // The actual implementation will need to:
      // 1. Initialize the Stablecoin Studio SDK
      // 2. Call the appropriate SDK method to create the stablecoin
      // 3. Handle the response and format it appropriately

      // For now, we'll return a structured placeholder response
      const result = {
        tokenId: '0.0.PLACEHOLDER',
        proxyAddress: params.proofOfReserve
          ? '0.0.PLACEHOLDER_PROXY'
          : undefined,
        reserveAddress: params.proofOfReserve
          ? '0.0.PLACEHOLDER_RESERVE'
          : undefined,
        transactionId: 'PLACEHOLDER_TX_ID',
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        initialSupply: params.initialSupply,
        maxSupply: params.maxSupply,
        supplyType: params.supplyType,
      };

      const humanMessage = `Successfully created stablecoin "${params.name}" (${params.symbol}) with token ID ${result.tokenId}. ${
        params.proofOfReserve
          ? `Proof of reserve enabled with reserve address ${result.reserveAddress}.`
          : ''
      } Transaction ID: ${result.transactionId}`;

      return {
        raw: result,
        humanMessage,
      };
    } catch (error) {
      const message = `Failed to create stablecoin: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return {
        raw: { error: message },
        humanMessage: message,
      };
    }
  },
});
