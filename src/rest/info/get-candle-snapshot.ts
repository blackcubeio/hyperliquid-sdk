import type { JsonValue, MarketKind } from '../../common/types';
import { infoRequest } from '../client';

/**
 * Bougie OHLCV au **format unifié Blackcube** (clés courtes, identiques entre les SDK
 * hyperliquid/pacifica/aster). Prix et volume sont des **chaînes décimales**.
 */
export interface Candle {
  /** Open time — début de la bougie (timestamp ms). */
  t: number;
  /** Close time — fin de la bougie (timestamp ms). */
  T: number;
  /** Symbol — coin (perp) ou paire (spot, ex. `@1`, `PURR/USDC`). */
  s: string;
  /** Interval — intervalle (ex. `1h`). */
  i: string;
  /** Open — prix d'ouverture. */
  o: string;
  /** Close — prix de clôture. */
  c: string;
  /** High — plus haut. */
  h: string;
  /** Low — plus bas. */
  l: string;
  /** Volume — volume en actif de base. */
  v: string;
  /** Number of trades — nombre de trades. */
  n: number;
  /** Type de marché, déduit du `coin` (cf. {@link marketKindFromCoin}). */
  kind: MarketKind;
}

/**
 * Déduit le type de marché d'un `coin` Hyperliquid : une paire **spot** est nommée
 * `BASE/QUOTE` (ex. `PURR/USDC`) ou `@{index}` (ex. `@1`) ; tout le reste est un **perp**
 * (ticker simple : `BTC`, `HYPE`…).
 */
export function marketKindFromCoin(coin: string): MarketKind {
  return coin.includes('/') || /^@\d+$/.test(coin) ? 'spot' : 'perp';
}

/**
 * Bougies OHLC. Les paramètres sont imbriqués sous `req` côté wire. Chaque bougie est taguée
 * `kind` (déduit du `coin`, surchargeable via `params.kind`).
 * @param params `interval` ex. "1m", "1h" ; `startTime`/`endTime` en ms.
 */
export function getCandleSnapshot(
  params: {
    coin: string;
    interval: string;
    startTime: number;
    endTime?: number;
    /** Force le `kind` ; par défaut déduit du `coin`. */
    kind?: MarketKind;
  },
  label?: string,
): Promise<Candle[]> {
  const req: Record<string, JsonValue> = {
    coin: params.coin,
    interval: params.interval,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    req.endTime = params.endTime;
  }
  const kind = params.kind ?? marketKindFromCoin(params.coin);
  return infoRequest<Omit<Candle, 'kind'>[]>({ type: 'candleSnapshot', req }, label).then(
    (candles) => candles.map((candle) => ({ ...candle, kind })),
  );
}
