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
    return {
      coin: position.name,
      entryPx: position.entryPrice ?? undefined,
      unrealizedPnl: position.unrealizedPnl as string,
      liquidationPx: position.liquidationPrice,
      marginUsed: position.margin as string,
      ...position.xtras,
    } as unknown as PositionNative;
  }
}
