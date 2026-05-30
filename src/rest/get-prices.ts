import type { HyperliquidClient } from '../common/config';
import type { Price } from '../common/types';
import { PriceConverter } from '../converters/price';
import { getMetaAndAssetCtxs } from './info/get-meta-and-asset-ctxs';

/**
 * Prix de tous les marchés perp au **format unifié** `Price` (HL : `metaAndAssetCtxs`).
 * `mark`/`mid`/`oracle`/`funding`/`openInterest`/`volume24h`/`prevDayPrice` fournis ;
 * `time` absent de l'AssetCtx HL (`null`).
 */
export function getPrices(client: HyperliquidClient, label?: string): Promise<Price[]> {
  return getMetaAndAssetCtxs(client, label).then(([meta, ctxs]) =>
    ctxs.map((ctx, index) => new PriceConverter(meta.universe[index]?.name ?? '').toCommon(ctx)),
  );
}
