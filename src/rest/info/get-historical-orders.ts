import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Ordres historiques d'un compte (statut final inclus), au-delà des seuls ordres ouverts. */
export function getHistoricalOrders(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'historicalOrders', user: params.user }, label);
}
