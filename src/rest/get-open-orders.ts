import type { JsonValue, Order } from '../common/types';
import { infoRequest } from './client';
import { OrderConverter, type OrderNative } from './converters/order';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetOpenOrdersParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
  /** Filtre optionnel sur une paire (appliqué côté client). */
  name?: string;
}

/** Ordres ouverts au **format unifié** `Order` (HL `openOrders`). */
export function getOpenOrders(params: GetOpenOrdersParams, label?: string): Promise<Order[]> {
  const converter = new OrderConverter();
  const body: Record<string, JsonValue> = { type: 'openOrders', user: params.user };
  return infoRequest<OrderNative[]>(body, label).then((wire) => {
    const orders = wire.map((entry) => converter.toCommon(entry));
    return params.name === undefined ? orders : orders.filter((o) => o.name === params.name);
  });
}
