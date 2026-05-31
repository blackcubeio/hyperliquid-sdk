import type { FrontendOrder, Order } from '../common/types';
import { marketKindFromCoin } from '../rest/info/get-candle-snapshot';

/** `orderType` HL (frontend) → type d'ordre unifié. */
const ORDER_TYPE: Record<string, Order['type']> = {
  Limit: 'limit',
  Market: 'market',
  'Stop Limit': 'stop',
  'Stop Market': 'stopMarket',
  'Take Profit Limit': 'takeProfit',
  'Take Profit Market': 'takeProfitMarket',
};

const TIF: Record<string, Order['tif']> = {
  Gtc: 'gtc',
  Ioc: 'ioc',
  Alo: 'alo',
  FrontendMarket: 'ioc',
};

/**
 * Convertisseur **`FrontendOrder` → `Order`** (type commun) : `frontendOpenOrders` / `orderStatus`
 * HL portent plus que `openOrders` (orderType, tif, reduceOnly, triggerPx). `filled = origSz - sz`.
 * Champs natifs hors cœur conservés dans `xtras`.
 */
export class FrontendOrderConverter {
  toCommon(wire: FrontendOrder): Order {
    const { coin, limitPx, oid, sz, origSz, side, orderType, tif, cloid, timestamp, ...rest } =
      wire;
    return {
      name: coin,
      kind: marketKindFromCoin(coin),
      id: String(oid),
      clientId: cloid ?? null,
      side: side === 'B' ? 'buy' : 'sell',
      type: ORDER_TYPE[orderType] ?? 'limit',
      price: limitPx,
      size: origSz,
      filled: String(Number(origSz) - Number(sz)),
      status: 'open',
      tif: tif == null ? null : (TIF[tif] ?? null),
      reduceOnly: wire.reduceOnly ?? null,
      time: timestamp,
      xtras: rest as Record<string, unknown>,
    };
  }
}
