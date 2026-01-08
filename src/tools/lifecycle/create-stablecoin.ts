import { type Context, type Tool, PromptGenerator } from 'hedera-agent-kit';
import {
  StableCoin,
  CreateRequest,
  TokenSupplyType,
} from '@hashgraph/stablecoin-npm-sdk';
import { createStablecoinSchema } from '@/schemas/lifecycle.schema';
import { CREATE_STABLECOIN_TOOL } from '@/utils/constants';
import { getStablecoinSDK } from '@/service/stablecoin-sdk.service';

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

  execute: async (client, context, params) => {
    try {
      // Initialize SDK connection
      const sdk = getStablecoinSDK();
      await sdk.ensureInitialized(client, context);

      // Get operator account ID for role assignments
      const operatorAccountId =
        client?.operatorAccountId?.toString() ||
        process.env.HEDERA_ACCOUNT_ID ||
        '';

      if (!operatorAccountId) {
        throw new Error('Operator account ID not found');
      }

      // Determine supply type
      const supplyType = params.maxSupply !== undefined
        ? TokenSupplyType.FINITE
        : (params.supplyType === 'FINITE' ? TokenSupplyType.FINITE : TokenSupplyType.INFINITE);

      // Build CreateRequest with all parameters
      const createRequest = new CreateRequest({
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        initialSupply: params.initialSupply?.toString() || '0',
        maxSupply: params.maxSupply?.toString(),
        supplyType,
        metadata: params.memo,

        // Keys - use 'null' string to indicate no key, or operator account
        freezeKey: params.freezeKey ? { key: params.freezeKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        kycKey: params.kycKey ? { key: params.kycKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        wipeKey: params.wipeKey ? { key: params.wipeKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        pauseKey: params.pauseKey ? { key: params.pauseKey, type: 'ED25519' } : { key: 'null', type: 'null' },
        feeScheduleKey: params.feeScheduleKey ? { key: params.feeScheduleKey, type: 'ED25519' } : { key: 'null', type: 'null' },

        // Reserve configuration
        createReserve: params.proofOfReserve || false,

        // Role assignments - default to operator account
        burnRoleAccount: operatorAccountId,
        wipeRoleAccount: operatorAccountId,
        rescueRoleAccount: operatorAccountId,
        pauseRoleAccount: operatorAccountId,
        freezeRoleAccount: operatorAccountId,
        deleteRoleAccount: operatorAccountId,
        kycRoleAccount: operatorAccountId,
        cashInRoleAccount: operatorAccountId,
        feeRoleAccount: operatorAccountId,
        proxyOwnerAccount: operatorAccountId,

        // Grant KYC to original sender by default
        grantKYCToOriginalSender: true,

        // Default allowances
        cashInRoleAllowance: '0',

        // Configuration IDs (using defaults from examples)
        configId: '0x0000000000000000000000000000000000000000000000000000000000000002',
        configVersion: 1,
      });

      // Create the stablecoin
      const stableCoin = await StableCoin.create(createRequest);

      // Extract result data from SDK response
      const result = {
        tokenId: stableCoin?.coin?.tokenId?.toString() || '',
        proxyAddress: stableCoin?.coin?.proxyAddress?.toString(),
        reserveAddress: stableCoin?.coin?.reserveAddress?.toString(),
        treasury: stableCoin?.coin?.treasury?.toString(),
        name: stableCoin?.coin?.name || params.name,
        symbol: stableCoin?.coin?.symbol || params.symbol,
        decimals: stableCoin?.coin?.decimals || params.decimals,
        totalSupply: stableCoin?.coin?.totalSupply?.toString(),
        maxSupply: stableCoin?.coin?.maxSupply?.toString(),
        paused: stableCoin?.coin?.paused,
      };

      const humanMessage = `Successfully created stablecoin "${result.name}" (${result.symbol}) with token ID ${result.tokenId}. ${
        stableCoin?.coin?.reserveAddress
          ? `Proof of reserve enabled with reserve address ${result.reserveAddress}. `
          : ''
      }Treasury: ${result.treasury}`;

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
