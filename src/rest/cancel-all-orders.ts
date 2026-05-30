import type { HyperliquidClient } from '../common/config';
import type { CancelAllOrdersParams, CancelAllResult } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildCancelAction } from './exchange/cancel-order';
import { getOpenOrders } from './get-open-orders';
import { getMeta } from './info/get-meta';

/**
 * Annule tous les ordres ouverts (**écriture signée**, HL). HL n'a pas d'endpoint « cancel all »
 * direct → récupère les ordres ouverts puis les annule par `oid` en une action.
 */
export function cancelAllOrders(
  client: HyperliquidClient,
  params: CancelAllOrdersParams,
  label: string,
): Promise<CancelAllResult> {
  return Promise.all([
    getMeta(client, undefined, label),
    getOpenOrders(client, { user: params.user, name: params.name }, label),
  ]).then(([meta, orders]) => {
    if (orders.length === 0) {
      return { cancelled: 0 };
    }
    const cancels = orders.map((order) => ({
      asset: assetIndex(meta.universe, order.name),
      oid: Number(order.id),
    }));
    return exchangeL1Action(client, buildCancelAction(cancels), label).then(() => ({
      cancelled: cancels.length,
    }));
  });
}
