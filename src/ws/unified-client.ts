import type { HyperliquidClient } from '../common/config';
import type {
  Candle,
  MarketKind,
  Order,
  OrderBook,
  Price,
  Trade,
  UserTrade,
} from '../common/types';
import type { Unsubscribe } from '../common/ws';
import { BboWsConverter, type BboWsNative } from '../converters/bbo';
import { CandleConverter, type CandleNative } from '../converters/candle';
import { type OrderUpdateWsNative, OrderWsConverter } from '../converters/order';
import { OrderBookConverter, type OrderBookNative } from '../converters/order-book';
import { type AllMidsWsNative, PricesWsConverter } from '../converters/price';
import { TradeWsConverter, type TradeWsNative } from '../converters/trade';
import { UserTradeConverter, type UserTradeNative } from '../converters/user-trade';
import { WsClient } from './client';

/**
 * Client WebSocket **unifié Blackcube** (interne ; exposé via `Hyperliquid.ws()`). Chaque méthode
 * `subscribeX` délivre au handler le **type unifié déjà converti** (`Candle`, `OrderBook`…).
 * Wrappe le {@link WsClient} natif Hyperliquid (un seul socket : public + user-data).
 *
 * **Connexion automatique** : le socket est ouvert paresseusement à la 1ʳᵉ souscription et fermé
 * dès que le dernier abonnement est retiré (ref-counting). Le développeur ne gère que
 * `subscribeX(…) → unsubscribe()`. Converters WS **unidirectionnels** (lecture seule) : quand le
 * payload WS coïncide avec le natif REST (bougies, fills HL), le convertisseur REST est réutilisé.
 *
 * Les casts `raw as unknown as XNative` ci-dessous sont **strictement nécessaires** : le handler WS
 * natif délivre un `JsonValue` (forme de wire non typée, le serveur ne contractualise pas le shape),
 * qui n'a aucun chevauchement structurel avec les types natifs ; le convertisseur valide ensuite.
 */
export class UnifiedWsClient {
  private readonly client: HyperliquidClient;
  private readonly label: string | undefined;
  private ws: WsClient | null = null;
  private refs = 0;

  constructor(client: HyperliquidClient, label?: string) {
    this.client = client;
    this.label = label;
  }

  /** Ouvre (lazy) le socket et renvoie le client ; incrémente le ref-count. */
  private wsClient(): WsClient {
    if (this.ws === null) {
      this.ws = new WsClient(this.client, { label: this.label });
      void this.ws.connect();
    }
    this.refs += 1;
    return this.ws;
  }

  /** Décrémente le ref-count et ferme le socket s'il tombe à zéro. */
  private release(): void {
    this.refs -= 1;
    if (this.refs <= 0 && this.ws !== null) {
      this.ws.disconnect();
      this.ws = null;
      this.refs = 0;
    }
  }

  /** Souscription ref-comptée : ouvre le socket au 1er abonné, ferme au dernier. */
  private subscribe(fn: (ws: WsClient) => Unsubscribe): Unsubscribe {
    const off = fn(this.wsClient());
    let released = false;
    return () => {
      if (released === true) {
        return;
      }
      released = true;
      off();
      this.release();
    };
  }

  /** Bougies temps réel. `kind` (défaut `perp`) annote la bougie unifiée. */
  public subscribeCandles(
    params: { name: string; interval: string; kind?: MarketKind },
    handler: (candle: Candle) => void,
  ): Unsubscribe {
    const converter = new CandleConverter(params.kind ?? 'perp');
    return this.subscribe((ws) =>
      ws.subscribeCandle({ coin: params.name, interval: params.interval }, (raw) => {
        handler(converter.toCommon(raw as unknown as CandleNative));
      }),
    );
  }

  /** Trades publics temps réel : le handler est appelé **une fois par trade**. */
  public subscribeTrades(params: { name: string }, handler: (trade: Trade) => void): Unsubscribe {
    const converter = new TradeWsConverter();
    return this.subscribe((ws) =>
      ws.subscribeTrades({ coin: params.name }, (raw) => {
        for (const native of raw as unknown as TradeWsNative[]) {
          handler(converter.toCommon(native));
        }
      }),
    );
  }

  /** Meilleure limite (BBO) temps réel → {@link OrderBook} (1 niveau par côté). */
  public subscribeBbo(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const converter = new BboWsConverter(params.kind ?? 'perp');
    return this.subscribe((ws) =>
      ws.subscribeBbo({ coin: params.name }, (raw) => {
        handler(converter.toCommon(raw as unknown as BboWsNative));
      }),
    );
  }

  /** Carnet d'ordres (L2) temps réel → {@link OrderBook}. */
  public subscribeOrderBook(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const converter = new OrderBookConverter(params.kind ?? 'perp');
    return this.subscribe((ws) =>
      ws.subscribeL2Book({ coin: params.name }, (raw) => {
        handler(converter.toCommon(raw as unknown as OrderBookNative));
      }),
    );
  }

  /** Prix de tous les marchés (snapshot) : le handler reçoit un `Price[]` à chaque message. */
  public subscribePrices(handler: (prices: Price[]) => void): Unsubscribe {
    const converter = new PricesWsConverter('perp');
    return this.subscribe((ws) =>
      ws.subscribeAllMids((raw) => {
        handler(converter.toCommon(raw as unknown as AllMidsWsNative));
      }),
    );
  }

  /**
   * Mises à jour d'ordres du compte (user-data) : le handler est appelé **une fois par ordre**.
   * `user` (adresse du compte) est **requis** côté Hyperliquid.
   */
  public subscribeOrders(params: { user?: string }, handler: (order: Order) => void): Unsubscribe {
    if (params.user === undefined) {
      throw new Error('subscribeOrders: `user` (adresse du compte) est requis sur Hyperliquid');
    }
    const user = params.user as `0x${string}`;
    const converter = new OrderWsConverter();
    return this.subscribe((ws) =>
      ws.subscribeOrderUpdates({ user }, (raw) => {
        for (const event of raw as unknown as OrderUpdateWsNative[]) {
          handler(converter.toCommon(event));
        }
      }),
    );
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
    const user = params.user as `0x${string}`;
    const converter = new UserTradeConverter();
    return this.subscribe((ws) =>
      ws.subscribeUserFills({ user }, (raw) => {
        const fills = (raw as { fills?: UserTradeNative[] }).fills ?? [];
        for (const fill of fills) {
          handler(converter.toCommon(fill));
        }
      }),
    );
  }
}
