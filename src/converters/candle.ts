import type { Candle, MarketKind } from '../common/types';

/**
 * Bougie native Hyperliquid (réponse `candleSnapshot`) — objet aux clés courtes.
 * Hyperliquid ne fournit ni quote/taker volumes ni champ supplémentaire.
 */
export interface CandleNative {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

/**
 * Convertisseur **bijectif total** bougie : `toCommon(native) → Candle` / `toNative(Candle) → native`.
 * Le `kind` (déduit du coin, absent du wire) est porté par le convertisseur.
 * `qv`/`tbbv`/`tbqv` sont `null` (non fournis par HL) et `xtras` omis (rien hors common) → bijection exacte.
 */
export class CandleConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: CandleNative): Candle {
    return {
      t: wire.t,
      T: wire.T,
      s: wire.s,
      i: wire.i,
      o: wire.o,
      c: wire.c,
      h: wire.h,
      l: wire.l,
      v: wire.v,
      n: wire.n,
      kind: this.kind,
      qv: null,
      tbbv: null,
      tbqv: null,
    };
  }

  toNative(candle: Candle): CandleNative {
    return {
      t: candle.t,
      T: candle.T,
      s: candle.s,
      i: candle.i,
      o: candle.o,
      c: candle.c,
      h: candle.h,
      l: candle.l,
      v: candle.v,
      n: candle.n,
    };
  }
}
