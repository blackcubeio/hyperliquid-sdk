import type { HyperliquidClient } from '../common/config';
import type { GetOrderBookParams } from '../common/types';
import type { OrderBook } from '../common/types';
import { OrderBookConverter, type OrderBookNative } from '../converters/order-book';
import { infoRequest } from './client';
import { marketKindFromCoin } from './info/get-candle-snapshot';

/** Carnet d'ordres au **format unifié** `OrderBook` (HL `l2Book`). */
export function getOrderBook(
  client: HyperliquidClient,
  params: GetOrderBookParams,
  label?: string,
): Promise<OrderBook> {
  const kind = params.kind ?? marketKindFromCoin(params.name);
  const converter = new OrderBookConverter(kind);
  return infoRequest<OrderBookNative>(client, { type: 'l2Book', coin: params.name }, label).then(
    (wire) => converter.toCommon(wire),
  );
}
