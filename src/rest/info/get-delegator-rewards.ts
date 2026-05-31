import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Récompenses de staking accumulées par un compte. */
export function getDelegatorRewards(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'delegatorRewards', user: params.user }, label);
}
