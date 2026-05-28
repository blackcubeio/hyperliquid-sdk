import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface L2Level {
  px: string;
  sz: string;
  n: number;
}

export interface L2Book {
  coin: string;
  time: number;
  /** `[bids, asks]`. */
  levels: [L2Level[], L2Level[]];
}

/**
 * Carnet d'ordres niveau 2 d'une coin.
 * @param params `coin` (nom perp, ou `PURR/USDC` / `@{index}` pour le spot), agrégation optionnelle.
 */
export function getL2Book(params: {
  coin: string;
  nSigFigs?: number;
  mantissa?: number;
}): Promise<L2Book> {
  const body: Record<string, JsonValue> = { type: 'l2Book', coin: params.coin };
  if (params.nSigFigs !== undefined) {
    body.nSigFigs = params.nSigFigs;
  }
  if (params.mantissa !== undefined) {
    body.mantissa = params.mantissa;
  }
  return infoRequest<L2Book>(body);
}
