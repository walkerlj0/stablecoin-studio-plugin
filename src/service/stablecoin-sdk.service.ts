import {
  Network,
  InitializationRequest,
  ConnectRequest,
  SupportedWallets,
} from '@hashgraph/stablecoin-npm-sdk';
import type { Context } from 'hedera-agent-kit';

interface NetworkConfig {
  name: string;
  network: string;
  baseUrl: string;
  apiKey: string;
  headerName: string;
  selected: boolean;
}

interface SDKConfig {
  network: 'mainnet' | 'testnet';
  accountId: string;
  privateKey: string;
  factoryAddress?: string;
  resolverAddress?: string;
}

/**
 * Service layer for Stablecoin Studio SDK operations.
 * Handles initialization, connection, and provides singleton access to SDK.
 */
export class StablecoinSDKService {
  private static instance: StablecoinSDKService | null = null;
  private isInitialized = false;
  private isConnected = false;
  private currentConfig: SDKConfig | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of the service.
   */
  static getInstance(): StablecoinSDKService {
    if (!StablecoinSDKService.instance) {
      StablecoinSDKService.instance = new StablecoinSDKService();
    }
    return StablecoinSDKService.instance;
  }

  /**
   * Initialize and connect to the Hedera network using SDK.
   * This method is idempotent - calling it multiple times with the same config is safe.
   */
  async ensureInitialized(client: any, context: Context = {}): Promise<void> {
    const config = this.getConfigFromContext(client, context);

    // Check if we're already initialized with the same config
    if (this.isInitialized && this.isConnected && this.configMatches(config)) {
      return;
    }

    // Initialize network
    await this.initializeNetwork(config);

    // Connect to network
    await this.connectToNetwork(config);

    this.currentConfig = config;
    this.isInitialized = true;
    this.isConnected = true;
  }

  /**
   * Extract SDK configuration from client and context.
   */
  private getConfigFromContext(client: any, context: Context): SDKConfig {
    // Extract from environment variables or context
    const network = (process.env.NETWORK || (context as any).network || 'testnet') as 'mainnet' | 'testnet';
    const accountId = process.env.HEDERA_ACCOUNT_ID || client?.operatorAccountId?.toString() || '';
    const privateKey = process.env.HEDERA_PRIVATE_KEY || '';

    if (!accountId || !privateKey) {
      throw new Error('Missing required credentials: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set');
    }

    return {
      network,
      accountId,
      privateKey,
      factoryAddress: process.env.FACTORY_ADDRESS || (context as any).factoryAddress,
      resolverAddress: process.env.RESOLVER_ADDRESS || (context as any).resolverAddress,
    };
  }

  /**
   * Check if the current config matches a new config.
   */
  private configMatches(newConfig: SDKConfig): boolean {
    if (!this.currentConfig) return false;
    return (
      this.currentConfig.network === newConfig.network &&
      this.currentConfig.accountId === newConfig.accountId &&
      this.currentConfig.privateKey === newConfig.privateKey
    );
  }

  /**
   * Initialize the Hedera network.
   */
  private async initializeNetwork(config: SDKConfig): Promise<void> {
    const mirrorNodeConfig = this.getMirrorNodeConfig(config.network);
    const rpcNodeConfig = this.getRPCNodeConfig(config.network);

    const initRequest = new InitializationRequest({
      network: config.network,
      mirrorNode: mirrorNodeConfig,
      rpcNode: rpcNodeConfig,
      configuration: {
        factoryAddress: config.factoryAddress || this.getDefaultFactoryAddress(config.network),
        resolverAddress: config.resolverAddress || this.getDefaultResolverAddress(config.network),
      },
    });

    await Network.init(initRequest);
  }

  /**
   * Connect to the Hedera network with credentials.
   */
  private async connectToNetwork(config: SDKConfig): Promise<void> {
    const mirrorNodeConfig = this.getMirrorNodeConfig(config.network);
    const rpcNodeConfig = this.getRPCNodeConfig(config.network);

    const account = {
      accountId: config.accountId,
      privateKey: {
        key: config.privateKey,
        type: 'ED25519',
      },
    };

    const connectRequest = new ConnectRequest({
      account: account,
      network: config.network,
      mirrorNode: mirrorNodeConfig,
      rpcNode: rpcNodeConfig,
      wallet: SupportedWallets.CLIENT,
    });

    await Network.connect(connectRequest);
  }

  /**
   * Get mirror node configuration for the specified network.
   */
  private getMirrorNodeConfig(network: string): NetworkConfig {
    if (network === 'mainnet') {
      return {
        name: 'Mainnet Mirror Node',
        network: 'mainnet',
        baseUrl: 'https://mainnet-public.mirrornode.hedera.com/api/v1/',
        apiKey: '',
        headerName: '',
        selected: true,
      };
    }
    return {
      name: 'Testnet Mirror Node',
      network: 'testnet',
      baseUrl: 'https://testnet.mirrornode.hedera.com/api/v1/',
      apiKey: '',
      headerName: '',
      selected: true,
    };
  }

  /**
   * Get RPC node configuration for the specified network.
   */
  private getRPCNodeConfig(network: string): NetworkConfig {
    if (network === 'mainnet') {
      return {
        name: 'HashIO Mainnet',
        network: 'mainnet',
        baseUrl: 'https://mainnet.hashio.io/api',
        apiKey: '',
        headerName: '',
        selected: true,
      };
    }
    return {
      name: 'HashIO Testnet',
      network: 'testnet',
      baseUrl: 'https://testnet.hashio.io/api',
      apiKey: '',
      headerName: '',
      selected: true,
    };
  }

  /**
   * Get default factory address for the network.
   * These are placeholder values - should be configured per environment.
   */
  private getDefaultFactoryAddress(network: string): string {
    if (network === 'mainnet') {
      return '0.0.0'; // TODO: Set actual mainnet factory address
    }
    return '0.0.6431833'; // Testnet factory address from examples
  }

  /**
   * Get default resolver address for the network.
   * These are placeholder values - should be configured per environment.
   */
  private getDefaultResolverAddress(network: string): string {
    if (network === 'mainnet') {
      return '0.0.0'; // TODO: Set actual mainnet resolver address
    }
    return '0.0.6431794'; // Testnet resolver address from examples
  }

  /**
   * Reset the service state (mainly for testing).
   */
  reset(): void {
    this.isInitialized = false;
    this.isConnected = false;
    this.currentConfig = null;
  }
}

/**
 * Helper function to get the SDK service instance.
 */
export const getStablecoinSDK = () => StablecoinSDKService.getInstance();
