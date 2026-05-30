import type { MarketKind, OrderBook, OrderBookLevel } from '../common/types';

/** Niveau natif HL (`l2Book`). */
export interface L2LevelNative {
  px: string;
  sz: string;
  n: number;
}

/** Carnet natif HL (`l2Book`). `levels = [bids, asks]`. */
export interface OrderBookNative {
  coin: string;
  time: number;
  levels: [L2LevelNative[], L2LevelNative[]];
}

/**
 * Convertisseur **bijectif** carnet : `toCommon(native) → OrderBook` / `toNative(book) → native`.
 * `kind` (absent du wire) est porté par le convertisseur ; `name`/`time`/niveaux viennent du wire.
 * HL fournit `n` (nb d'ordres) par niveau. Rien hors cœur → pas de `xtras` → bijection totale.
 */
export class OrderBookConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: OrderBookNative): OrderBook {
    return {
      name: wire.coin,
      kind: this.kind,
      bids: wire.levels[0].map(toLevel),
      asks: wire.levels[1].map(toLevel),
      time: wire.time,
    };
  }

  toNative(book: OrderBook): OrderBookNative {
    return {
      coin: book.name,
      time: book.time as number,
      levels: [book.bids.map(toNativeLevel), book.asks.map(toNativeLevel)],
    };
  }
}

function toLevel(level: L2LevelNative): OrderBookLevel {
  return { price: level.px, size: level.sz, n: level.n };
}

function toNativeLevel(level: OrderBookLevel): L2LevelNative {
  return { px: level.price, sz: level.size, n: level.n as number };
}
