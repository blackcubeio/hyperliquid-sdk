import type { AssetCtx, MetaAndAssetCtxs } from '../../common/types';
import type { AssetMeta, Meta } from '../../common/types';
import { infoRequest } from '../client';
import { tagPerpMeta } from './get-meta';

type MetaWire = { universe: Omit<AssetMeta, 'kind'>[]; marginTables?: unknown[] };

export function getMetaAndAssetCtxs(label?: string): Promise<MetaAndAssetCtxs> {
  return infoRequest<[MetaWire, AssetCtx[]]>({ type: 'metaAndAssetCtxs' }, label).then(
    ([meta, ctxs]) => [tagPerpMeta(meta), ctxs],
  );
}
