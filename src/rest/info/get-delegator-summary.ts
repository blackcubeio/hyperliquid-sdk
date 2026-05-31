import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Résumé de staking d'un compte (montant délégué, non-staké, en cours de retrait). */
export function getDelegatorSummary(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'delegatorSummary', user: params.user }, label);
}
