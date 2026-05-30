import type { Candle, MarketKind } from '../common/types';
import { type CandleNative, CandleConverter } from '../rest/converters/candle';
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
}
