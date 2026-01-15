import { Client } from '@hashgraph/sdk';
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
   * If config changes, it will re-initialize with the new configuration.
   * 
   * @param requireAuth - If false, only initializes network without connecting (for read-only operations)
   */
  async ensureInitialized(client: any, context: Context = {}, requireAuth: boolean = true): Promise<void> {
    const config = this.getConfigFromContext(client, context, requireAuth);

    // Check if we're already initialized with the same config
    if (this.isInitialized && (!requireAuth || this.isConnected) && this.configMatches(config)) {
      return;
    }

    // If config changed, reset state before re-initializing
    // This ensures clean state when switching accounts/networks
    if (this.isInitialized && !this.configMatches(config)) {
      this.isInitialized = false;
      this.isConnected = false;
    }

    try {
      // Initialize network (always required)
      await this.initializeNetwork(config);

      // Connect to network only if authentication is required
      if (requireAuth) {
        await this.connectToNetwork(config);
        this.isConnected = true;
      }

      // Update state
      this.currentConfig = config;
      this.isInitialized = true;
    } catch (error) {
      // Reset state on error to allow retry
      this.isInitialized = false;
      this.isConnected = false;
      this.currentConfig = null;
      throw error;
    }
  }

  /**
   * Extract SDK configuration from client and context.
   * @param requireAuth - If false, private key is optional (for read-only operations)
   */
  private getConfigFromContext(client: Client, context: Context, requireAuth: boolean = true): SDKConfig {
    // Extract from environment variables or context
    const network = (process.env.NETWORK || (context as any).network || 'testnet') as 'mainnet' | 'testnet';
    const accountId = process.env.HEDERA_ACCOUNT_ID || client?.operatorAccountId?.toString() || '';
    
    // Try to extract private key from multiple sources
    const privateKey = process.env.HEDERA_PRIVATE_KEY || '';

    // Validate credentials based on whether auth is required
    if (requireAuth) {
      if (!accountId) {
        throw new Error(
          'Missing account ID. Set HEDERA_ACCOUNT_ID environment variable or ensure client has operatorAccountId set.'
        );
      }
      
      if (!privateKey) {
        throw new Error(
          'Missing private key. Set HEDERA_PRIVATE_KEY environment variable or ensure client has operatorPrivateKey set.'
        );
      }
    }

    return {
      network,
      accountId: accountId || '',
      privateKey: privateKey || '',
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
   * Detect key type based on private key format.
   * ED25519: 64 hex characters (32 bytes)
   * ECDSA: 66+ hex characters (33+ bytes), often with 0x prefix
   */
  private detectKeyType(privateKey: string): 'ED25519' | 'ECDSA' {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    // ED25519 keys are exactly 64 hex characters
    if (cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey)) {
      return 'ED25519';
    }
    
    return 'ECDSA';
  }

  /**
   * Connect to the Hedera network with credentials.
   * Requires a valid private key. For read-only operations, skip this step.
   */
  private async connectToNetwork(config: SDKConfig): Promise<void> {
    if (!config.privateKey) {
      throw new Error(
        'Private key is required for network connection. ' +
        'Use ensureInitialized(client, context, false) for read-only operations.'
      );
    }

    const mirrorNodeConfig = this.getMirrorNodeConfig(config.network);
    const rpcNodeConfig = this.getRPCNodeConfig(config.network);

    // Detect key type automatically
    const keyType = this.detectKeyType(config.privateKey);

    const account = {
      accountId: config.accountId,
      privateKey: {
        key: config.privateKey,
        type: keyType,
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
   */
  private getDefaultFactoryAddress(network: string): string {
    if (network === 'mainnet') {
      return '0.0.0'; // TODO: Configure mainnet factory address
    }
    return '0.0.6431833'; // Testnet factory address
  }

  /**
   * Get default resolver address for the network.
   */
  private getDefaultResolverAddress(network: string): string {
    if (network === 'mainnet') {
      return '0.0.0'; // TODO: Configure mainnet resolver address
    }
    return '0.0.6431794'; // Testnet resolver address
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
