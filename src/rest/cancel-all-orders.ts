import type { HyperliquidClient } from '../common/config';
import type { CancelAllOrdersParams, CancelAllResult } from '../common/types';
import { exchangeL1Action } from './client';
import { buildCancelAction } from './exchange/cancel-order';
import { getOpenOrders } from './get-open-orders';
import { resolveAsset } from './info/resolve-asset';

/**
 * Annule tous les ordres ouverts (**écriture signée**, HL). HL n'a pas d'endpoint « cancel all »
 * direct → récupère les ordres ouverts puis les annule par `oid` en une action. Chaque ordre est
 * résolu selon **son propre `kind`** (perp via index, spot via index + 10000) : un mélange
 * perp/spot dans les ordres ouverts est annulé correctement (le scope filtre déjà par `kind`).
 */
export function cancelAllOrders(
  client: HyperliquidClient,
  params: CancelAllOrdersParams,
  label: string,
): Promise<CancelAllResult> {
  const scopeKind = params.kind ?? 'perp';
  return getOpenOrders(client, { user: params.user, name: params.name }, label).then((orders) => {
    if (orders.length === 0) {
      return { cancelled: 0 };
    }
    return Promise.all(
      orders.map((order) => resolveAsset(client, order.name, order.kind ?? scopeKind, label)),
    ).then((assets) => {
      const cancels = orders.map((order, i) => ({
        asset: assets[i] as number,
        oid: Number(order.id),
      }));
      return exchangeL1Action(client, buildCancelAction(cancels), label).then(() => ({
        cancelled: cancels.length,
      }));
    });
  });
}
