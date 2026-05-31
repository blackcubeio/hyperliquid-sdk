import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Équités d'un compte dans les vaults qu'il suit. */
export function getUserVaultEquities(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'userVaultEquities', user: params.user }, label);
}
