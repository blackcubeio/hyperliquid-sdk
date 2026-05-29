import type { MarketKind } from '../common/types';
import { type Candle, getCandleSnapshot } from './info/get-candle-snapshot';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetCandlesParams {
  /** Identifiant de la paire (= `Pair.name`). */
  name: string;
  /** Intervalle (`1m`, `1h`, `1d`…). */
  interval: string;
  /** Début (ms). */
  startTime: number;
  /** Fin (ms), optionnel. */
  endTime?: number;
  /** Type de marché ; déduit du `name` chez HL, override possible. */
  kind?: MarketKind;
  /** Nombre max de bougies (ignoré par HL). */
  limit?: number;
}

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
