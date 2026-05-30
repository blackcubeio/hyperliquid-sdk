import type { HyperliquidClient } from '../../common/config';
import type { AssetCtx, MetaAndAssetCtxs } from '../../common/types';
import type { AssetMeta } from '../../common/types';
import { infoRequest } from '../client';
import { tagPerpMeta } from './get-meta';

type MetaWire = { universe: Omit<AssetMeta, 'kind'>[]; marginTables?: unknown[] };

export function getMetaAndAssetCtxs(
  client: HyperliquidClient,
  label?: string,
): Promise<MetaAndAssetCtxs> {
  return infoRequest<[MetaWire, AssetCtx[]]>(client, { type: 'metaAndAssetCtxs' }, label).then(
    ([meta, ctxs]) => [tagPerpMeta(meta), ctxs],
  );
}
