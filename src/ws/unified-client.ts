import type {
  Candle,
  MarketKind,
  Order,
  OrderBook,
  Price,
  Trade,
  UserTrade,
} from '../common/types';
import type { Unsubscribe, WsClientOptions } from '../common/ws';
import { BboWsConverter, type BboWsNative } from '../converters/bbo';
import { CandleConverter, type CandleNative } from '../converters/candle';
import { type OrderUpdateWsNative, OrderWsConverter } from '../converters/order';
import { OrderBookConverter, type OrderBookNative } from '../converters/order-book';
import { type AllMidsWsNative, PricesWsConverter } from '../converters/price';
import { TradeWsConverter, type TradeWsNative } from '../converters/trade';
import { UserTradeConverter, type UserTradeNative } from '../converters/user-trade';
import { WsClient } from './client';

/**
 * Client WebSocket **unifié Blackcube** : surface identique entre les SDK. Chaque méthode
 * `subscribeX` délivre au handler le **type unifié déjà converti** (`Candle`, `OrderBook`…).
 * Wrappe le {@link WsClient} natif Hyperliquid (un seul socket public + user-data).
 *
 * Les converters WS sont **unidirectionnels** (`toCommon` seul) : le flux est en lecture
 * seule, on ne renvoie jamais de payload WS au serveur. Quand le payload WS coïncide avec
 * le natif REST (cas des bougies HL), le convertisseur REST est réutilisé tel quel.
 */
export class UnifiedWsClient {
  private readonly client: WsClient;

  constructor(options: WsClientOptions = {}) {
    this.client = new WsClient(options);
  }

  public connect(): Promise<void> {
    return this.client.connect();
  }

  public disconnect(): void {
    this.client.disconnect();
  }

  /** Bougies temps réel. `kind` (défaut `perp`) annote la bougie unifiée. */
  public subscribeCandles(
    params: { name: string; interval: string; kind?: MarketKind },
    handler: (candle: Candle) => void,
  ): Unsubscribe {
    const converter = new CandleConverter(params.kind ?? 'perp');
    return this.client.subscribeCandle({ coin: params.name, interval: params.interval }, (raw) => {
      handler(converter.toCommon(raw as unknown as CandleNative));
    });
  }

  /** Trades publics temps réel : le handler est appelé **une fois par trade**. */
  public subscribeTrades(params: { name: string }, handler: (trade: Trade) => void): Unsubscribe {
    const converter = new TradeWsConverter();
    return this.client.subscribeTrades({ coin: params.name }, (raw) => {
      for (const native of raw as unknown as TradeWsNative[]) {
        handler(converter.toCommon(native));
      }
    });
  }

  /** Meilleure limite (BBO) temps réel → {@link OrderBook} (1 niveau par côté). */
  public subscribeBbo(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const converter = new BboWsConverter(params.kind ?? 'perp');
    return this.client.subscribeBbo({ coin: params.name }, (raw) => {
      handler(converter.toCommon(raw as unknown as BboWsNative));
    });
  }

  /** Carnet d'ordres (L2) temps réel → {@link OrderBook}. */
  public subscribeOrderBook(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const converter = new OrderBookConverter(params.kind ?? 'perp');
    return this.client.subscribeL2Book({ coin: params.name }, (raw) => {
      handler(converter.toCommon(raw as unknown as OrderBookNative));
    });
  }

  /** Prix de tous les marchés (snapshot) : le handler reçoit un `Price[]` à chaque message. */
  public subscribePrices(handler: (prices: Price[]) => void): Unsubscribe {
    const converter = new PricesWsConverter('perp');
    return this.client.subscribeAllMids((raw) => {
      handler(converter.toCommon(raw as unknown as AllMidsWsNative));
    });
  }

  /**
   * Mises à jour d'ordres du compte (user-data) : le handler est appelé **une fois par ordre**.
   * `user` (adresse du compte) est **requis** côté Hyperliquid.
   */
  public subscribeOrders(params: { user?: string }, handler: (order: Order) => void): Unsubscribe {
    if (params.user === undefined) {
      throw new Error('subscribeOrders: `user` (adresse du compte) est requis sur Hyperliquid');
    }
    const converter = new OrderWsConverter();
    return this.client.subscribeOrderUpdates({ user: params.user as `0x${string}` }, (raw) => {
      for (const event of raw as unknown as OrderUpdateWsNative[]) {
        handler(converter.toCommon(event));
      }
    });
  }

  /**
   * Fills du compte (user-data) : le handler est appelé **une fois par fill** (snapshot inclus).
   * `user` (adresse du compte) est **requis** côté Hyperliquid. Réutilise le converter REST
   * (le `fill` WS a la forme du natif REST `UserFill`).
   */
  public subscribeUserTrades(
    params: { user?: string },
    handler: (trade: UserTrade) => void,
  ): Unsubscribe {
    if (params.user === undefined) {
      throw new Error('subscribeUserTrades: `user` (adresse du compte) est requis sur Hyperliquid');
    }
    const converter = new UserTradeConverter();
    return this.client.subscribeUserFills({ user: params.user as `0x${string}` }, (raw) => {
      const fills = (raw as { fills?: UserTradeNative[] }).fills ?? [];
      for (const fill of fills) {
        handler(converter.toCommon(fill));
      }
    });
  }
}
