import { infoRequest } from '../client';
import { type SpotMeta, type SpotPair, type SpotToken, tagSpotMeta } from './get-meta-spot';

export interface SpotAssetCtx {
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
  midPx: string | null;
  circulatingSupply: string;
  coin: string;
  totalSupply: string;
  dayBaseVlm: string;
}

/**
 * `[metaSpot, contextes]` : l'univers spot + les contextes (mark/mid price, volumes, supply) par
 * paire. Le contexte porte son `coin` ; la liste des contextes n'est pas strictement alignée sur
 * `universe` (matcher par `coin`).
 */
export type SpotMetaAndAssetCtxs = [SpotMeta, SpotAssetCtx[]];

type SpotMetaWire = { tokens: SpotToken[]; universe: Omit<SpotPair, 'kind'>[] };

export function getMetaAndAssetCtxsSpot(label?: string): Promise<SpotMetaAndAssetCtxs> {
  return infoRequest<[SpotMetaWire, SpotAssetCtx[]]>({ type: 'spotMetaAndAssetCtxs' }, label).then(
    ([meta, ctxs]) => [tagSpotMeta(meta), ctxs],
  );
}
