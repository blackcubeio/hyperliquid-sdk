import type { Side, UserTrade } from '../common/types';
import { UserTradeConverter } from './user-trade';

/**
 * Confirmation d'un **ordre TWAP** placé (`placeTwap`). HL répond
 * `{ status:'ok', response:{ data:{ status:{ running:{ twapId } } | { error } } } }`. On expose un
 * type **nommé** aligné sur le vocabulaire commun (`name`/`side`/`size`) + l'`id` du TWAP ; le natif
 * complet reste dans `xtras`.
 */
export interface TwapPlacement {
  /** ID du TWAP (à passer à `cancelTwap`) ; `null` si HL a rejeté l'ordre. */
  id: string | null;
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Sens. */
  side: Side;
  /** Taille totale du TWAP (chaîne décimale). */
  size: string;
  /** `running` si le TWAP est lancé, sinon `error`. */
  status: 'running' | 'error';
  /** Réponse native complète (rien jeté). */
  xtras: Record<string, unknown>;
}

/** Réponse native d'un `placeTwap`. */
export interface TwapOrderNative {
  response?: { data?: { status?: { running?: { twapId?: number }; error?: string } } };
  [key: string]: unknown;
}

/** Métadonnées d'entrée reportées dans la sortie (vocabulaire commun). */
export interface TwapPlacementRef {
  name: string;
  side: Side;
  size: string;
}

/** Convertisseur **réponse `placeTwap` → {@link TwapPlacement}**. */
export class TwapPlacementConverter {
  toCommon(wire: TwapOrderNative, ref: TwapPlacementRef): TwapPlacement {
    const twapId = wire.response?.data?.status?.running?.twapId;
    return {
      id: twapId === undefined ? null : String(twapId),
      name: ref.name,
      side: ref.side,
      size: ref.size,
      status: twapId === undefined ? 'error' : 'running',
      xtras: wire as Record<string, unknown>,
    };
  }
}

/**
 * Fill d'une **slice de TWAP** (`getTwapFills`). HL renvoie `[{ fill: UserFill, twapId }]` : on réutilise
 * le {@link UserTrade} commun (le `fill` a la forme native d'un `UserFill`) et on range `twapId` dans
 * `xtras`.
 */
export interface TwapSliceFillNative {
  fill: import('../common/types').UserFill;
  twapId: number;
}

/** Convertisseur **slice de TWAP → {@link UserTrade}** (réutilise {@link UserTradeConverter}). */
export class TwapFillConverter {
  private readonly fills = new UserTradeConverter();

  toCommon(wire: TwapSliceFillNative): UserTrade {
    const trade = this.fills.toCommon(wire.fill);
    trade.xtras = { ...trade.xtras, twapId: wire.twapId };
    return trade;
  }
}
