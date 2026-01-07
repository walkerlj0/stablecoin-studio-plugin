import { z } from 'zod';
import type { Context } from 'hedera-agent-kit';
import {
  accountIdSchema,
  tokenIdSchema,
  memoSchema,
  decimalsSchema,
  supplyTypeSchema,
} from './atoms';

/**
 * Schema for creating a new stablecoin
 */
export const createStablecoinSchema = (_context: Context = {}) =>
  z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .describe('Token name (e.g., "MyUSD Stablecoin")'),
    symbol: z
      .string()
      .min(1)
      .max(100)
      .describe('Token symbol (e.g., "MUSDC")'),
    decimals: decimalsSchema,
    initialSupply: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0)
      .describe(
        'Initial token supply in base units (default: 0, tokens can be minted later)'
      ),
    maxSupply: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Maximum supply limit in base units (optional, omit for unlimited supply)'
      ),
    supplyType: supplyTypeSchema,
    proofOfReserve: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Enable proof of reserve tracking for collateralization (default: false)'
      ),
    memo: memoSchema,
    kycKey: accountIdSchema
      .optional()
      .describe('Account ID that will control KYC operations (optional)'),
    freezeKey: accountIdSchema
      .optional()
      .describe('Account ID that will control freeze operations (optional)'),
    wipeKey: accountIdSchema
      .optional()
      .describe('Account ID that will control wipe operations (optional)'),
    pauseKey: accountIdSchema
      .optional()
      .describe('Account ID that will control pause operations (optional)'),
    feeScheduleKey: accountIdSchema
      .optional()
      .describe('Account ID that will control fee schedule operations (optional)'),
  });

export type CreateStablecoinParams = z.infer<
  ReturnType<typeof createStablecoinSchema>
>;

/**
 * Schema for getting stablecoin information
 */
export const getStablecoinInfoSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema.describe('Token ID of the stablecoin to query'),
  });

export type GetStablecoinInfoParams = z.infer<
  ReturnType<typeof getStablecoinInfoSchema>
>;

/**
 * Schema for updating stablecoin properties
 */
export const updateStablecoinSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema.describe('Token ID of the stablecoin to update'),
    name: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe('New token name (optional)'),
    symbol: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe('New token symbol (optional)'),
    memo: memoSchema.describe('New memo (optional)'),
  });

export type UpdateStablecoinParams = z.infer<
  ReturnType<typeof updateStablecoinSchema>
>;

/**
 * Schema for pausing a stablecoin
 */
export const pauseStablecoinSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema.describe('Token ID of the stablecoin to pause'),
  });

export type PauseStablecoinParams = z.infer<
  ReturnType<typeof pauseStablecoinSchema>
>;

/**
 * Schema for unpausing a stablecoin
 */
export const unpauseStablecoinSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema.describe('Token ID of the stablecoin to unpause'),
  });

export type UnpauseStablecoinParams = z.infer<
  ReturnType<typeof unpauseStablecoinSchema>
>;

/**
 * Schema for deleting a stablecoin
 */
export const deleteStablecoinSchema = (_context: Context = {}) =>
  z.object({
    tokenId: tokenIdSchema.describe(
      'Token ID of the stablecoin to permanently delete'
    ),
  });

export type DeleteStablecoinParams = z.infer<
  ReturnType<typeof deleteStablecoinSchema>
>;
