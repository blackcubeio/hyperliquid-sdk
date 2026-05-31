import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Historique des opérations de staking (delegate/undelegate, dépôts/retraits) d'un compte. */
export function getDelegatorHistory(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'delegatorHistory', user: params.user }, label);
}
