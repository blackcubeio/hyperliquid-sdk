import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface Candle {
  /** Début (ms). */
  t: number;
  /** Fin (ms). */
  T: number;
  /** Coin. */
  s: string;
  /** Intervalle. */
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

/**
 * Bougies OHLC. Les paramètres sont imbriqués sous `req` côté wire.
 * @param params `interval` ex. "1m", "1h" ; `startTime`/`endTime` en ms.
 */
export function getCandleSnapshot(params: {
  coin: string;
  interval: string;
  startTime: number;
  endTime?: number;
}): Promise<Candle[]> {
  const req: Record<string, JsonValue> = {
    coin: params.coin,
    interval: params.interval,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    req.endTime = params.endTime;
  }
  return infoRequest<Candle[]>({ type: 'candleSnapshot', req });
}
