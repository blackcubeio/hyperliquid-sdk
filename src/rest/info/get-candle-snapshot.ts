import type { Candle, JsonValue, MarketKind } from '../../common/types';
import { CandleConverter, type CandleNative } from '../../converters/candle';
import { infoRequest } from '../client';

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
  const converter = new CandleConverter(params.kind ?? marketKindFromCoin(params.coin));
  return infoRequest<CandleNative[]>({ type: 'candleSnapshot', req }, label).then((candles) =>
    candles.map((candle) => converter.toCommon(candle)),
  );
}
