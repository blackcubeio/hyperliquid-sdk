import type { HyperliquidClient } from '../common/config';
import type { MarketKind, Order, Tif } from '../common/types';
import { exchangeL1Action } from './client';
import { buildOrderAction } from './exchange/place-order';
import { resolveAsset } from './info/resolve-asset';

/** Leg d'un lot, au **vocabulaire commun** (= forme de `PlaceOrderParams` du contrat). */
export interface BatchOrderLeg {
  name: string;
  /** Type de marché du leg ; défaut `perp`. Détermine la résolution d'asset (perp vs spot +10000). */
  kind?: MarketKind;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop' | 'stopMarket' | 'takeProfit' | 'takeProfitMarket';
  size: string;
  price?: string;
  triggerPrice?: string;
  tif?: 'gtc' | 'ioc' | 'fok' | 'alo';
  reduceOnly?: boolean;
  clientId?: string;
}

const TIF: Record<'gtc' | 'ioc' | 'fok' | 'alo', Tif> = {
  gtc: 'Gtc',
  ioc: 'Ioc',
  fok: 'Ioc',
  alo: 'Alo',
};

interface BatchResponse {
  response?: { data?: { statuses?: { resting?: { oid: number }; filled?: { oid: number } }[] } };
}

/**
 * Place un **lot** d'ordres au format unifié (écriture signée, HL `/exchange`, 1 seule action).
 * Entrée = legs en **vocabulaire commun** ; sortie = `Order[]` (type commun), 1 `Order` par leg,
 * `id`/`status`/`filled` dérivés de la réponse — **même normalisation que `placeOrder`**.
 */
export function placeBatchOrders(
  client: HyperliquidClient,
  orders: BatchOrderLeg[],
  label: string,
  // Grouping HL : 'na' (indépendants, défaut) ; 'normalTpsl' (entrée + TP/SL OCO) ; 'positionTpsl'
  // (TP/SL attachés à la position — utilisé par `placeProtection` : SL + N TPs reduce-only).
  grouping: 'na' | 'normalTpsl' | 'positionTpsl' = 'na',
): Promise<Order[]> {
  // HL exige un `price` par leg (limite, ou borne de slippage en market) — comme `placeOrder`.
  const priced = orders.map((o) => {
    if (o.price === undefined) {
      throw new Error('placeBatch (Hyperliquid) : `price` est requis pour chaque leg.');
    }
    return { ...o, price: o.price };
  });
  // Résolution d'asset **par leg** selon son `kind` (perp via index, spot via index + 10000).
  return Promise.all(priced.map((o) => resolveAsset(client, o.name, o.kind ?? 'perp', label))).then(
    (assets) => {
      const legs = priced.map((o, i) => ({
        asset: assets[i] as number,
        isBuy: o.side === 'buy',
        price: o.price,
        size: o.size,
        reduceOnly: o.reduceOnly,
        tif: o.type === 'market' ? ('Ioc' as Tif) : TIF[o.tif ?? 'gtc'],
        cloid: o.clientId as `0x${string}` | undefined,
        triggerPx: o.triggerPrice,
        isMarket: o.type === 'stopMarket' || o.type === 'takeProfitMarket',
        tpsl: (o.type === 'takeProfit' || o.type === 'takeProfitMarket' ? 'tp' : 'sl') as
          | 'tp'
          | 'sl',
      }));
      return exchangeL1Action<BatchResponse>(client, buildOrderAction(legs, grouping), label).then(
        (res) => {
          const statuses = res.response?.data?.statuses ?? [];
          return priced.map((o, i) => {
            const status = statuses[i];
            const oid = status?.resting?.oid ?? status?.filled?.oid;
            return {
              name: o.name,
              kind: o.kind ?? ('perp' as const),
              id: oid === undefined ? '' : String(oid),
              clientId: o.clientId ?? null,
              side: o.side,
              type: o.type,
              price: o.price,
              size: o.size,
              filled: status?.filled === undefined ? '0' : o.size,
              status: status?.filled === undefined ? ('open' as const) : ('filled' as const),
              tif: o.tif ?? (o.type === 'market' ? 'ioc' : 'gtc'),
              reduceOnly: o.reduceOnly ?? null,
              time: Date.now(),
              xtras: { status },
            };
          });
        },
      );
    },
  );
}
