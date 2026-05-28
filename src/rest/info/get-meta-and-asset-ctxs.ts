import { infoRequest } from '../client';
import type { Meta } from './get-meta';

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

export function getMetaAndAssetCtxs(): Promise<MetaAndAssetCtxs> {
  return infoRequest<MetaAndAssetCtxs>({ type: 'metaAndAssetCtxs' });
}
