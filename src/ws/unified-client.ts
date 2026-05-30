import type { Candle, MarketKind, OrderBook, Trade } from '../common/types';
import { type CandleNative, CandleConverter } from '../rest/converters/candle';
import { type BboWsNative, BboWsConverter } from './converters/bbo';
import { type TradeWsNative, TradeWsConverter } from './converters/trade';
import { WsClient, type Unsubscribe, type WsClientOptions } from './client';

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
  public subscribeTrades(
    params: { name: string },
    handler: (trade: Trade) => void,
  ): Unsubscribe {
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
}
