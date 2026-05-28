import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface OpenOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: string;
  sz: string;
  timestamp: number;
  origSz?: string;
  cloid?: string;
}

/** Ordres ouverts d'un compte. `user` = adresse réelle du compte (jamais l'agent wallet). */
export function getOpenOrders(params: {
  user: `0x${string}`;
  dex?: string;
}): Promise<OpenOrder[]> {
  const body: Record<string, JsonValue> = { type: 'openOrders', user: params.user };
  if (params.dex !== undefined) {
    body.dex = params.dex;
  }
  return infoRequest<OpenOrder[]>(body);
}
