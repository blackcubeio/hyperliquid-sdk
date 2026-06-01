import type { HyperliquidClient } from '../common/config';
import type { CancelOrderParams } from '../common/types';
import { exchangeL1Action } from './client';
import { buildCancelAction } from './exchange/cancel-order';
import { resolveAsset } from './info/resolve-asset';

/** Annule un ordre par `id`/oid (**écriture signée**, HL `/exchange`). */
export function cancelOrder(
  client: HyperliquidClient,
  params: CancelOrderParams,
  label: string,
): Promise<void> {
  return resolveAsset(client, params.name, params.kind ?? 'perp', label).then((asset) => {
    return exchangeL1Action(
      client,
      buildCancelAction([{ asset, oid: Number(params.id) }]),
      label,
    ).then(() => undefined);
  });
}
