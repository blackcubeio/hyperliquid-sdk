import type { HyperliquidClient } from '../../common/config';
import type { SpotAssetCtx, SpotMetaAndAssetCtxs } from '../../common/types';
import type { SpotPair, SpotToken } from '../../common/types';
import { infoRequest } from '../client';
import { tagSpotMeta } from './get-meta-spot';

type SpotMetaWire = { tokens: SpotToken[]; universe: Omit<SpotPair, 'kind'>[] };

export function getMetaAndAssetCtxsSpot(
  client: HyperliquidClient,
  label?: string,
): Promise<SpotMetaAndAssetCtxs> {
  return infoRequest<[SpotMetaWire, SpotAssetCtx[]]>(
    client,
    { type: 'spotMetaAndAssetCtxs' },
    label,
  ).then(([meta, ctxs]) => [tagSpotMeta(meta), ctxs]);
}
