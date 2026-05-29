import type { Price } from '../../common/types';
import type { AssetCtx } from '../info/get-meta-and-asset-ctxs';

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
