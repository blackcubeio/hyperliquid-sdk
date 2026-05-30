import type { HyperliquidClient } from '../../common/config';
import type { OrderParams, OrderWire } from '../../common/types';
import { toWireValue } from '../../common/utils';
import { exchangeL1Action } from '../client';

/**
 * Construit l'action L1 `order` (clés courtes a/b/p/s/r/t/c, dans l'ordre exact attendu
 * par le hash). Exporté pour test/inspection sans envoi réseau.
 */
export function buildOrderAction(orders: OrderParams[], grouping = 'na'): Record<string, unknown> {
  return {
    type: 'order',
    orders: orders.map((order) => buildOrderWire(order)),
    grouping,
  };
}

/** Convertit un ordre en wire (clés courtes a/b/p/s/r/t/c). Réutilisé par `editOrder`. */
export function buildOrderWire(order: OrderParams): OrderWire {
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
export function createLimitOrder<TResponse = unknown>(
  client: HyperliquidClient,
  order: OrderParams,
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildOrderAction([order]), label);
}

/**
 * Place un ordre « marché » : un IOC au `price` fourni (Hyperliquid n'a pas de type marché
 * natif ; `price` borne le slippage accepté).
 */
export function createMarketOrder<TResponse = unknown>(
  client: HyperliquidClient,
  order: Omit<OrderParams, 'tif'>,
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildOrderAction([{ ...order, tif: 'Ioc' }]), label);
}

/** Place plusieurs ordres dans une seule action atomique (signé, `/exchange`). */
export function placeOrders<TResponse = unknown>(
  client: HyperliquidClient,
  orders: OrderParams[],
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildOrderAction(orders), label);
}
