import type { GetOpenOrdersParams } from '../common/types';
import type { JsonValue, Order } from '../common/types';
import { OrderConverter, type OrderNative } from '../converters/order';
import { infoRequest } from './client';

/** Ordres ouverts au **format unifié** `Order` (HL `openOrders`). */
export function getOpenOrders(params: GetOpenOrdersParams, label?: string): Promise<Order[]> {
  const converter = new OrderConverter();
  const body: Record<string, JsonValue> = { type: 'openOrders', user: params.user };
  return infoRequest<OrderNative[]>(body, label).then((wire) => {
    const orders = wire.map((entry) => converter.toCommon(entry));
    return params.name === undefined ? orders : orders.filter((o) => o.name === params.name);
  });
}
