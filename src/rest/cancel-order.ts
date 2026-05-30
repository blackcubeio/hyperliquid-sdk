import type { HyperliquidClient } from '../common/config';
import type { CancelOrderParams } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildCancelAction } from './exchange/cancel-order';
import { getMeta } from './info/get-meta';

/** Annule un ordre par `id`/oid (**écriture signée**, HL `/exchange`). */
export function cancelOrder(
  client: HyperliquidClient,
  params: CancelOrderParams,
  label: string,
): Promise<void> {
  return getMeta(client, undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action(
      client,
      buildCancelAction([{ asset, oid: Number(params.id) }]),
      label,
    ).then(() => undefined);
  });
}
