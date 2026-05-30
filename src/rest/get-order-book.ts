import type { MarketKind, OrderBook } from '../common/types';
import { infoRequest } from './client';
import { OrderBookConverter, type OrderBookNative } from '../converters/order-book';
import { marketKindFromCoin } from './info/get-candle-snapshot';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetOrderBookParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Type de marché ; défaut déduit du coin. */
  kind?: MarketKind;
  /** Ignoré par HL (carnet complet renvoyé). */
  limit?: number;
}

/** Carnet d'ordres au **format unifié** `OrderBook` (HL `l2Book`). */
export function getOrderBook(params: GetOrderBookParams, label?: string): Promise<OrderBook> {
  const kind = params.kind ?? marketKindFromCoin(params.name);
  const converter = new OrderBookConverter(kind);
  return infoRequest<OrderBookNative>({ type: 'l2Book', coin: params.name }, label).then((wire) =>
    converter.toCommon(wire),
  );
}
