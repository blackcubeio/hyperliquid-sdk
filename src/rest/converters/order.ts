import type { Order } from '../../common/types';
import type { OpenOrder } from '../info/get-open-orders';

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
