import type { HyperliquidClient } from '../../common/config';
import { toWireValue } from '../../common/utils';
import { exchangeL1Action } from '../client';

export interface TwapOrderParams {
  /** Index d'actif (perp). */
  asset: number;
  /** `true` = achat. */
  isBuy: boolean;
  /** Taille totale (chaîne décimale ou nombre). */
  size: number | string;
  /** Réduction de position seulement. */
  reduceOnly?: boolean;
  /** Durée en minutes (5 ≤ m ≤ 1440). */
  minutes: number;
  /** Randomiser le découpage des slices. */
  randomize?: boolean;
}

/** Construit l'action L1 `twapOrder` (objet `twap` ordonné a,b,s,r,m,t). */
export function buildTwapOrderAction(params: TwapOrderParams): Record<string, unknown> {
  return {
    type: 'twapOrder',
    twap: {
      a: params.asset,
      b: params.isBuy,
      s: toWireValue(params.size),
      r: params.reduceOnly ?? false,
      m: params.minutes,
      t: params.randomize ?? false,
    },
  };
}

/** Place un ordre TWAP (signé, `/exchange`). */
export function twapOrder<TResponse = unknown>(
  client: HyperliquidClient,
  params: TwapOrderParams,
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildTwapOrderAction(params), label);
}
