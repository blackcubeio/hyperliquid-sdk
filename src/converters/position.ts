import type { Position } from '../common/types';
import type { PerpPosition } from '../common/types';

/** Position native HL (`clearinghouseState.assetPositions[].position`). */
export type PositionNative = PerpPosition;

/**
 * Convertisseur **bijectif** position : `toCommon(native) → Position` / inverse.
 * `side`/`size` dérivés du `szi` signé, `leverage` de `leverage.value` — sources (szi, objet
 * leverage, positionValue…) conservées dans `xtras`. `markPrice` absent du wire HL (`null`).
 */
export class PositionConverter {
  toCommon(wire: PositionNative): Position {
    const { coin, entryPx, unrealizedPnl, liquidationPx, marginUsed, ...rest } = wire;
    const num = Number(rest.szi);
    return {
      name: coin,
      side: num > 0 ? 'long' : num < 0 ? 'short' : null,
      size: rest.szi.replace('-', ''),
      entryPrice: entryPx ?? null,
      markPrice: null,
      unrealizedPnl,
      leverage: rest.leverage.value,
      liquidationPrice: liquidationPx,
      margin: marginUsed,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(position: Position): PositionNative {
    // `xtras` porte les champs natifs omis du cœur (`szi`, `positionValue`, `leverage`…) :
    // on les restitue explicitement (pas de double cast — la forme native est typée).
    const xtras = (position.xtras ?? {}) as Partial<PositionNative>;
    return {
      coin: position.name,
      szi: xtras.szi ?? '0',
      entryPx: position.entryPrice ?? undefined,
      positionValue: xtras.positionValue ?? '0',
      unrealizedPnl: position.unrealizedPnl ?? '0',
      returnOnEquity: xtras.returnOnEquity ?? '0',
      leverage: xtras.leverage ?? { type: 'cross', value: 1 },
      liquidationPx: position.liquidationPrice,
      marginUsed: position.margin ?? '0',
      maxLeverage: xtras.maxLeverage ?? 1,
      cumFunding: xtras.cumFunding ?? { allTime: '0', sinceOpen: '0', sinceChange: '0' },
    };
  }
}
