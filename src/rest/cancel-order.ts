import type { CancelOrderParams } from '../common/types';
import type { MarketKind } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildCancelAction } from './exchange/cancel-order';
import { getMeta } from './info/get-meta';

/** Annule un ordre par `id`/oid (**écriture signée**, HL `/exchange`). */
export function cancelOrder(params: CancelOrderParams, label: string): Promise<void> {
  return getMeta(undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action(buildCancelAction([{ asset, oid: Number(params.id) }]), label).then(
      () => undefined,
    );
  });
}
