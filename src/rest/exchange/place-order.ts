import { toWireValue } from '../../common/utils';
import { type ExchangeOptions, exchangeL1Action } from '../client';

export type Tif = 'Gtc' | 'Ioc' | 'Alo';

export interface OrderParams {
  /** Asset ID entier (index dans `meta` pour les perps, `10000 + index` pour le spot). */
  asset: number;
  isBuy: boolean;
  price: number | string;
  size: number | string;
  reduceOnly?: boolean;
  /** Défaut : `Gtc`. */
  tif?: Tif;
  /** Client order ID (bytes16 hex, `0x…`). */
  cloid?: `0x${string}`;
}

interface OrderWire {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t: { limit: { tif: Tif } };
  c?: `0x${string}`;
}

/**
 * Construit l'action L1 `order` (clés courtes a/b/p/s/r/t/c, dans l'ordre exact attendu
 * par le hash). Exporté pour test/inspection sans envoi réseau.
 */
export function buildOrderAction(orders: OrderParams[], grouping = 'na'): Record<string, unknown> {
  return {
    type: 'order',
    orders: orders.map((order) => orderToWire(order)),
    grouping,
  };
}

function orderToWire(order: OrderParams): OrderWire {
  const wire: OrderWire = {
    a: order.asset,
    b: order.isBuy,
    p: toWireValue(order.price),
    s: toWireValue(order.size),
    r: order.reduceOnly ?? false,
    t: { limit: { tif: order.tif ?? 'Gtc' } },
  };
  if (order.cloid !== undefined) {
    wire.c = order.cloid;
  }
  return wire;
}

/** Place un ordre limite (signé, `/exchange`). */
export function placeOrder<TResponse = unknown>(
  order: OrderParams,
  options?: ExchangeOptions,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildOrderAction([order]), options);
}

/** Place plusieurs ordres dans une seule action atomique. */
export function placeOrders<TResponse = unknown>(
  orders: OrderParams[],
  options?: ExchangeOptions,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildOrderAction(orders), options);
}
