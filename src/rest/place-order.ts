import type { MarketKind, Order, Side } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { type Tif, buildOrderAction } from './exchange/place-order';
import { getMeta } from './info/get-meta';

/** Type d'ordre unifié supporté par HL (`placeOrder`). */
export type PlaceOrderType = 'limit' | 'market';
/** Time-in-force unifié. */
export type PlaceOrderTif = 'gtc' | 'ioc' | 'fok' | 'alo';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface PlaceOrderParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Sens. */
  side: Side;
  /** Type d'ordre (`limit` ou `market` = IOC borné par `price`). */
  type: PlaceOrderType;
  /** Quantité (chaîne décimale). */
  size: string;
  /** Prix (limite, ou borne de slippage pour `market` — requis côté HL). */
  price: string;
  /** Time-in-force (limit). */
  tif?: PlaceOrderTif;
  /** Reduce-only. */
  reduceOnly?: boolean;
  /** Client order id (bytes16 hex `0x…`). */
  clientId?: `0x${string}`;
}

const TIF: Record<PlaceOrderTif, Tif> = { gtc: 'Gtc', ioc: 'Ioc', fok: 'Ioc', alo: 'Alo' };

interface OrderResponse {
  response?: { data?: { statuses?: { resting?: { oid: number }; filled?: { oid: number } }[] } };
}

/**
 * Passe un ordre au **format unifié** (**écriture signée**, HL `/exchange`).
 * Résout `name` → asset index, place l'ordre, puis construit l'`Order` depuis les paramètres
 * (l'`id` est extrait de la réponse si présent). `market` = IOC borné par `price`.
 */
export function placeOrder(params: PlaceOrderParams, label: string): Promise<Order> {
  const tif: Tif = params.type === 'market' ? 'Ioc' : TIF[params.tif ?? 'gtc'];
  return getMeta(undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action<OrderResponse>(
      buildOrderAction([
        {
          asset,
          isBuy: params.side === 'buy',
          price: params.price,
          size: params.size,
          reduceOnly: params.reduceOnly,
          tif,
          cloid: params.clientId,
        },
      ]),
      label,
    ).then((res) => {
      const status = res.response?.data?.statuses?.[0];
      const oid = status?.resting?.oid ?? status?.filled?.oid;
      return {
        name: params.name,
        kind: 'perp',
        id: oid === undefined ? '' : String(oid),
        clientId: params.clientId ?? null,
        side: params.side,
        type: params.type,
        price: params.price,
        size: params.size,
        filled: status?.filled === undefined ? '0' : params.size,
        status: status?.filled === undefined ? 'open' : 'filled',
        tif: params.tif ?? (params.type === 'market' ? 'ioc' : 'gtc'),
        reduceOnly: params.reduceOnly ?? null,
        time: Date.now(),
        xtras: { response: res },
      };
    });
  });
}
