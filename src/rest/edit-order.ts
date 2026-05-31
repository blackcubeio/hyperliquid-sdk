import type { HyperliquidClient } from '../common/config';
import type { EditOrderParams, EditOrderResult } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildModifyAction } from './exchange/modify-order';
import { getMeta } from './info/get-meta';

/** Modifie un ordre existant (**écriture signée**, HL `/exchange` — remplace l'ordre). */
export function editOrder(
  client: HyperliquidClient,
  params: EditOrderParams,
  label: string,
): Promise<EditOrderResult> {
  return getMeta(client, undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
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
