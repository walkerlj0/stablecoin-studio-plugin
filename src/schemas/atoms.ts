import { z } from 'zod';

/**
 * Common schema atoms for Stablecoin Studio plugin
 * These are reusable schema pieces used across different tool schemas
 */

export const accountIdSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected Hedera AccountId like 0.0.1234')
  .describe('Hedera AccountId (e.g., 0.0.1234)');

export const tokenIdSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected Hedera TokenId like 0.0.123456')
  .describe('Hedera TokenId (e.g., 0.0.123456)');

export const memoSchema = z
  .string()
  .max(100, 'Max 100 chars')
  .optional()
  .describe('Optional transaction memo (max 100 characters)');

export const roleSchema = z
  .enum([
    'ADMIN',
    'CASHIN',
    'BURN',
    'WIPE',
    'RESCUE',
    'PAUSE',
    'FREEZE',
    'KYC',
    'DELETE',
    'FEE',
  ])
  .describe(
    'Role type for stablecoin operations: ADMIN (full control), CASHIN (mint), BURN (burn from treasury), WIPE (remove from accounts), RESCUE (rescue assets), PAUSE (pause/unpause), FREEZE (freeze/unfreeze accounts), KYC (manage KYC), DELETE (delete token), FEE (manage fees)'
  );

export const supplyTypeSchema = z
  .enum(['FINITE', 'INFINITE'])
  .optional()
  .describe(
    'Supply type: FINITE (limited max supply) or INFINITE (no maximum)'
  );

export const amountSchema = z
  .number()
  .positive()
  .describe('Amount in base units (e.g., 1000000 for 1.0 with 6 decimals)');

export const decimalsSchema = z
  .number()
  .int()
  .min(0)
  .max(18)
  .optional()
  .default(6)
  .describe('Number of decimal places for the token (0-18, default: 6)');
