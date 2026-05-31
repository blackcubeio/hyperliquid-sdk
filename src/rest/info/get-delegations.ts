import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Délégations de staking en cours d'un compte (par validateur). */
export function getDelegations(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'delegations', user: params.user }, label);
}
