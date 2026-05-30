import type { HyperliquidClient } from '../../common/config';
import type { FrontendOrder } from '../../common/types';
import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/** Ordres ouverts avec les infos d'affichage (type d'ordre, triggers, TP/SL…). */
export function getFrontendOpenOrders(
  client: HyperliquidClient,
  params: {
    user: `0x${string}`;
    dex?: string;
  },
  label?: string,
): Promise<FrontendOrder[]> {
  const body: Record<string, JsonValue> = { type: 'frontendOpenOrders', user: params.user };
  if (params.dex !== undefined) {
    body.dex = params.dex;
  }
  return infoRequest<FrontendOrder[]>(client, body, label);
}
