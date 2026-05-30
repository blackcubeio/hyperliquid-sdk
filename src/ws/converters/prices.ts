import type { MarketKind, Price } from '../../common/types';

/** Payload WS `allMids` HL — `{mids: {symbol: mid}}` (snapshot de tous les mids). */
export interface AllMidsWsNative {
  mids: Record<string, string>;
}

/**
 * Convertisseur WS **unidirectionnel** prix → `Price[]` (snapshot multi-symboles).
 * HL `allMids` ne fournit que le `mid` ; tout le reste est `null` (cœur unifié `Price`).
 */
export class PricesWsConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: AllMidsWsNative): Price[] {
    return Object.entries(wire.mids).map(([name, mid]) => ({
      name,
      kind: this.kind,
      mark: null,
      oracle: null,
      mid,
      bid: null,
      ask: null,
      last: null,
      funding: null,
      openInterest: null,
      volume24h: null,
      prevDayPrice: null,
      time: null,
    }));
  }
}
