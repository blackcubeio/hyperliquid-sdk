import type { SpotAssetCtx, SpotMetaAndAssetCtxs } from '../../common/types';
import type { SpotMeta, SpotPair, SpotToken } from '../../common/types';
import { infoRequest } from '../client';
import { tagSpotMeta } from './get-meta-spot';

type SpotMetaWire = { tokens: SpotToken[]; universe: Omit<SpotPair, 'kind'>[] };

export function getMetaAndAssetCtxsSpot(label?: string): Promise<SpotMetaAndAssetCtxs> {
  return infoRequest<[SpotMetaWire, SpotAssetCtx[]]>({ type: 'spotMetaAndAssetCtxs' }, label).then(
    ([meta, ctxs]) => [tagSpotMeta(meta), ctxs],
  );
}
