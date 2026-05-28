import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface UserFill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
}

/** Historique d'exécutions (fills) d'un compte. */
export function getUserFills(
  params: {
    user: `0x${string}`;
    aggregateByTime?: boolean;
  },
  label?: string,
): Promise<UserFill[]> {
  const body: Record<string, JsonValue> = { type: 'userFills', user: params.user };
  if (params.aggregateByTime !== undefined) {
    body.aggregateByTime = params.aggregateByTime;
  }
  return infoRequest<UserFill[]>(body, label);
}
