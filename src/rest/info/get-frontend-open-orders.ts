import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface FrontendOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: string;
  sz: string;
  timestamp: number;
  origSz: string;
  orderType: string;
  reduceOnly?: boolean;
  tif?: string | null;
  cloid?: string | null;
  isPositionTpsl?: boolean;
  isTrigger?: boolean;
  triggerPx?: string;
  triggerCondition?: string;
}

/** Ordres ouverts avec les infos d'affichage (type d'ordre, triggers, TP/SL…). */
export function getFrontendOpenOrders(params: {
  user: `0x${string}`;
  dex?: string;
}): Promise<FrontendOrder[]> {
  const body: Record<string, JsonValue> = { type: 'frontendOpenOrders', user: params.user };
  if (params.dex !== undefined) {
    body.dex = params.dex;
  }
  return infoRequest<FrontendOrder[]>(body);
}
