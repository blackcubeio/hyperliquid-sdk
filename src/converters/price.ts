import type { MarketKind, Price } from '../common/types';
import type { AssetCtx } from '../common/types';

/** Contexte natif HL (`metaAndAssetCtxs`) — le `name` vient du meta aligné par index. */
export type PriceNative = AssetCtx;

/**
 * Convertisseur **bijectif** prix : `toCommon(native) → Price` / `toNative(price) → native`.
 * `name` (absent de l'AssetCtx, fourni par le meta) est porté par le convertisseur ; `kind=perp`.
 * `premium`/`impactPxs` → `xtras`. HL n'a pas de `time` dans l'AssetCtx (`null`). Bijection totale.
 */
export class PriceConverter {
  constructor(private readonly name: string) {}

  toCommon(wire: PriceNative): Price {
    return {
      name: this.name,
      kind: 'perp',
      mark: wire.markPx,
      oracle: wire.oraclePx,
      mid: wire.midPx,
      bid: null,
      ask: null,
      last: null,
      funding: wire.funding,
      openInterest: wire.openInterest,
      volume24h: wire.dayNtlVlm,
      prevDayPrice: wire.prevDayPx,
      time: null,
      xtras: { premium: wire.premium, impactPxs: wire.impactPxs },
    };
  }

  toNative(price: Price): PriceNative {
    const xtras = price.xtras ?? {};
    return {
      funding: price.funding as string,
      openInterest: price.openInterest as string,
      prevDayPx: price.prevDayPrice as string,
      dayNtlVlm: price.volume24h as string,
      premium: (xtras.premium ?? null) as string | null,
      oraclePx: price.oracle as string,
      markPx: price.mark as string,
      midPx: price.mid,
      impactPxs: (xtras.impactPxs ?? null) as string[] | null,
    };
  }
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

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
