import type { MarketKind, OrderBook, OrderBookLevel } from '../common/types';

/** Niveau BBO natif HL. */
export interface BboLevelNative {
  px: string;
  sz: string;
  n: number;
}

/** Payload WS `bbo` HL — `{coin, time, bbo: [bid, ask]}` (chaque côté peut être `null`). */
export interface BboWsNative {
  coin: string;
  time: number;
  bbo: [BboLevelNative | null, BboLevelNative | null];
}

/**
 * Convertisseur WS **unidirectionnel** BBO → {@link OrderBook} (1 niveau bid + 1 ask).
 * `n` (nb d'ordres) fourni par HL. Rien hors cœur → pas de `xtras`.
 */
export class BboWsConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: BboWsNative): OrderBook {
    return {
      name: wire.coin,
      kind: this.kind,
      bids: side(wire.bbo[0]),
      asks: side(wire.bbo[1]),
      time: wire.time,
    };
  }
}

function side(level: BboLevelNative | null): OrderBookLevel[] {
  return level === null ? [] : [{ price: level.px, size: level.sz, n: level.n }];
}
