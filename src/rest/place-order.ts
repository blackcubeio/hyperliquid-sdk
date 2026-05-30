import type { HyperliquidClient } from '../common/config';
import type { PlaceOrderParams, PlaceOrderTif } from '../common/types';
import type { Order } from '../common/types';
import type { Tif } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildOrderAction } from './exchange/place-order';
import { getMeta } from './info/get-meta';

const TIF: Record<PlaceOrderTif, Tif> = { gtc: 'Gtc', ioc: 'Ioc', fok: 'Ioc', alo: 'Alo' };

interface OrderResponse {
  response?: { data?: { statuses?: { resting?: { oid: number }; filled?: { oid: number } }[] } };
}

/**
 * Passe un ordre au **format unifié** (**écriture signée**, HL `/exchange`).
 * Résout `name` → asset index, place l'ordre, puis construit l'`Order` depuis les paramètres
 * (l'`id` est extrait de la réponse si présent). `market` = IOC borné par `price`.
 */
export function placeOrder(
  client: HyperliquidClient,
  params: PlaceOrderParams,
  label: string,
): Promise<Order> {
  const tif: Tif = params.type === 'market' ? 'Ioc' : TIF[params.tif ?? 'gtc'];
  return getMeta(client, undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action<OrderResponse>(
      client,
      buildOrderAction([
        {
          asset,
          isBuy: params.side === 'buy',
          price: params.price,
          size: params.size,
          reduceOnly: params.reduceOnly,
          tif,
          cloid: params.clientId,
        },
      ]),
      label,
    ).then((res) => {
      const status = res.response?.data?.statuses?.[0];
      const oid = status?.resting?.oid ?? status?.filled?.oid;
      return {
        name: params.name,
        kind: 'perp',
        id: oid === undefined ? '' : String(oid),
        clientId: params.clientId ?? null,
        side: params.side,
        type: params.type,
        price: params.price,
        size: params.size,
        filled: status?.filled === undefined ? '0' : params.size,
        status: status?.filled === undefined ? 'open' : 'filled',
        tif: params.tif ?? (params.type === 'market' ? 'ioc' : 'gtc'),
        reduceOnly: params.reduceOnly ?? null,
        time: Date.now(),
        xtras: { response: res },
      };
    });
  });
}
