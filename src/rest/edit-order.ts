import type { HyperliquidClient } from '../common/config';
import type { EditOrderParams, EditOrderResult } from '../common/types';
import { exchangeL1Action } from './client';
import { buildModifyAction } from './exchange/modify-order';
import { resolveAsset } from './info/resolve-asset';

/** Modifie un ordre existant (**écriture signée**, HL `/exchange` — remplace l'ordre). */
export function editOrder(
  client: HyperliquidClient,
  params: EditOrderParams,
  label: string,
): Promise<EditOrderResult> {
  return resolveAsset(client, params.name, params.kind ?? 'perp', label).then((asset) => {
    return exchangeL1Action(
      client,
      buildModifyAction({
        oid: Number(params.id),
        order: {
          asset,
          isBuy: params.side === 'buy',
          price: params.price,
          size: params.size,
          reduceOnly: params.reduceOnly,
          tif: 'Gtc',
        },
      }),
      label,
    ).then((response) => ({ name: params.name, id: params.id, xtras: { response } }));
  });
}
