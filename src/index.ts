import { Context, Plugin } from 'hedera-agent-kit';

// Import lifecycle tools
import createStablecoinTool from '@/tools/lifecycle/create-stablecoin';
import getStablecoinInfoTool from '@/tools/lifecycle/get-stablecoin-info';
import updateStablecoinTool from '@/tools/lifecycle/update-stablecoin';
import pauseStablecoinTool from '@/tools/lifecycle/pause-stablecoin';
import unpauseStablecoinTool from '@/tools/lifecycle/unpause-stablecoin';
import deleteStablecoinTool from '@/tools/lifecycle/delete-stablecoin';

/**
 * Stablecoin Studio Plugin for Hedera Agent Kit
 *
 * This plugin enables AI agents to create and manage stablecoins on the Hedera network
 * using the Stablecoin Studio SDK. It provides comprehensive tools for:
 * - Stablecoin lifecycle management (create, update, pause, delete)
 * - Role-based access control
 * - Compliance operations (KYC, freeze/unfreeze)
 * - Treasury operations (mint, burn, wipe, transfer)
 * - Reserve management and proof of reserve
 * - Advanced features (holds/escrow, custom fees)
 * - Query and analytics
 */
export default {
  name: 'stablecoin-studio-plugin',
  version: '1.0.0',
  description:
    'Hedera Stablecoin Studio operations for AI agents - create and manage stablecoins with role-based access control, compliance, and treasury management',
  tools: (context: Context) => {
    return [
      // Lifecycle tools (6 tools)
      createStablecoinTool(context),
      getStablecoinInfoTool(context),
      updateStablecoinTool(context),
      pauseStablecoinTool(context),
      unpauseStablecoinTool(context),
      deleteStablecoinTool(context),

      // Additional tool categories will be added here as they are implemented:
      // - Access Control tools (7 tools)
      // - Compliance tools (5 tools)
      // - Treasury tools (6 tools)
      // - Reserve tools (2 tools)
      // - Advanced tools (6 tools)
      // - Query tools (5 tools)
    ];
  },
} satisfies Plugin;

// Export tool name constants for filtering and reference
export * from '@/utils/constants';

// Export schemas for external use
export * from '@/schemas/atoms';
export * from '@/schemas/lifecycle.schema';
