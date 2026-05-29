import { infoRequest } from '../client';
import { type AssetMeta, type Meta, tagPerpMeta } from './get-meta';

export interface AssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string | null;
  oraclePx: string;
  markPx: string;
  midPx: string | null;
  impactPxs: string[] | null;
}

/** `[meta, contextes]` : l'univers + les contextes (mark price, funding, OI…) par actif, alignés par index. */
export type MetaAndAssetCtxs = [Meta, AssetCtx[]];

type MetaWire = { universe: Omit<AssetMeta, 'kind'>[]; marginTables?: unknown[] };

export function getMetaAndAssetCtxs(label?: string): Promise<MetaAndAssetCtxs> {
  return infoRequest<[MetaWire, AssetCtx[]]>({ type: 'metaAndAssetCtxs' }, label).then(
    ([meta, ctxs]) => [tagPerpMeta(meta), ctxs],
  );
}
