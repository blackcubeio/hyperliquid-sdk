import type { Candle, GetCandlesParams, MarketKind } from '../common/types';
import { getCandleSnapshot } from './info/get-candle-snapshot';

/** Bougies au **format unifié** (`getCandles`, même API sur les 3 SDK). */
export function getCandles(params: GetCandlesParams, label?: string): Promise<Candle[]> {
  return getCandleSnapshot(
    {
      coin: params.name,
      interval: params.interval,
      startTime: params.startTime,
      endTime: params.endTime,
      kind: params.kind,
    },
    label,
  );
}
