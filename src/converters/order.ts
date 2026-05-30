import type { Order } from '../common/types';
import type { OpenOrder } from '../common/types';

/** Ordre ouvert natif HL (`openOrders`). */
export type OrderNative = OpenOrder;

/**
 * Convertisseur **bijectif** ordre : `toCommon(native) → Order` / inverse.
 * HL `openOrders` est minimal (toujours `limit`, statut `open`). `side` (A/B), `sz`, `origSz`
 * natifs sont conservés dans `xtras` → `toNative` les restitue. `filled` = `origSz - sz` (dérivé).
 */
export class OrderConverter {
  toCommon(wire: OrderNative): Order {
    const { coin, limitPx, oid, timestamp, cloid, ...rest } = wire;
    const orig = rest.origSz ?? rest.sz;
    const filled = rest.origSz === undefined ? '0' : String(Number(rest.origSz) - Number(rest.sz));
    return {
      name: coin,
      kind: coin.includes('/') || /^@\d+$/.test(coin) ? 'spot' : 'perp',
      id: String(oid),
      clientId: cloid ?? null,
      side: rest.side === 'B' ? 'buy' : 'sell',
      type: 'limit',
      price: limitPx,
      size: orig,
      filled,
      status: 'open',
      tif: null,
      reduceOnly: null,
      time: timestamp,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(order: Order): OrderNative {
    return {
      coin: order.name,
      limitPx: order.price as string,
      oid: Number(order.id),
      timestamp: order.time,
      cloid: order.clientId ?? undefined,
      ...order.xtras,
    } as unknown as OrderNative;
  }
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

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

const WS_STATUS: Record<string, Order['status']> = {
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
 * Réutilise le converter REST (même `order` natif), puis applique le `status` WS réel.
 * `wsStatus`/`statusTimestamp` natifs vont dans `xtras` — rien jeté.
 */
export class OrderWsConverter {
  private readonly rest = new OrderConverter();

  toCommon(event: OrderUpdateWsNative): Order {
    const order = this.rest.toCommon(event.order);
    order.status = WS_STATUS[event.status] ?? 'other';
    order.xtras = {
      ...order.xtras,
      wsStatus: event.status,
      statusTimestamp: event.statusTimestamp,
    };
    return order;
  }
}
