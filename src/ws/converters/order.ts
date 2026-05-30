import type { Order } from '../../common/types';
import { type OrderNative, OrderConverter } from '../../rest/converters/order';

/**
 * Élément du payload WS `orderUpdates` HL — `{order, status, statusTimestamp}`.
 * `order` a la même forme que le natif REST `OpenOrder` → converter REST réutilisé ;
 * `status` (WS) surcharge le statut `open` figé du REST.
 */
export interface OrderUpdateWsNative {
  order: OrderNative;
  status: string;
  statusTimestamp: number;
}

const STATUS: Record<string, Order['status']> = {
  open: 'open',
  filled: 'filled',
  canceled: 'canceled',
  marginCanceled: 'canceled',
  reduceOnlyCanceled: 'canceled',
  liquidatedCanceled: 'canceled',
  rejected: 'rejected',
  expired: 'expired',
  triggered: 'open',
};

/**
 * Convertisseur WS **unidirectionnel** ordre → {@link Order}.
 * Réutilise le converter REST pour `order`, puis applique le `status` WS réel.
 * `wsStatus`/`statusTimestamp` natifs vont dans `xtras` — rien jeté.
 */
export class OrderWsConverter {
  private readonly rest = new OrderConverter();

  toCommon(event: OrderUpdateWsNative): Order {
    const order = this.rest.toCommon(event.order);
    order.status = STATUS[event.status] ?? 'other';
    order.xtras = { ...order.xtras, wsStatus: event.status, statusTimestamp: event.statusTimestamp };
    return order;
  }
}
