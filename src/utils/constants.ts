/**
 * Tool method name constants for Stablecoin Studio plugin
 * These constants are used to identify each tool uniquely
 */

// Lifecycle tools
export const CREATE_STABLECOIN_TOOL = 'stablecoin.create_stablecoin';
export const GET_STABLECOIN_INFO_TOOL = 'stablecoin.get_stablecoin_info';
export const UPDATE_STABLECOIN_TOOL = 'stablecoin.update_stablecoin';
export const PAUSE_STABLECOIN_TOOL = 'stablecoin.pause_stablecoin';
export const UNPAUSE_STABLECOIN_TOOL = 'stablecoin.unpause_stablecoin';
export const DELETE_STABLECOIN_TOOL = 'stablecoin.delete_stablecoin';

// Plugin constants
export const DEFAULT_DECIMALS = 6;
export const DEFAULT_INITIAL_SUPPLY = 0;
export const MAX_DECIMALS = 18;
export const MAX_SUPPLY_LIMIT = 9223372036854775807; // Max int64

/**
 * Network configuration for Hedera networks
 */
export type NetworkConfig = {
  mirrorNodeUrl: string;
  jsonRpcUrl: string;
  networkType: 'mainnet' | 'testnet';
};

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    jsonRpcUrl: 'https://mainnet.hashio.io/api',
    networkType: 'mainnet',
  },
  testnet: {
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    jsonRpcUrl: 'https://testnet.hashio.io/api',
    networkType: 'testnet',
  },
};
