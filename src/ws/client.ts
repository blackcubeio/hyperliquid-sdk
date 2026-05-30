import { type WebSocketFactory, type WebSocketLike, getConfig } from '../common/config';
import type { JsonObject, JsonValue } from '../common/types';
import type { CancelParams } from '../common/types';
import type { ModifyParams } from '../common/types';
import type { OrderParams } from '../common/types';
import type { StreamHandler, Unsubscribe, WsClientOptions } from '../common/ws';
import { resolveReadNetwork, resolveSigner } from '../rest/client';
import { buildCancelAction } from '../rest/exchange/cancel-order';
import { buildModifyAction } from '../rest/exchange/modify-order';
import { buildOrderAction } from '../rest/exchange/place-order';
import { signL1Action } from '../rest/signing';

interface PendingPost {
  resolve: (value: JsonValue) => void;
  reject: (reason: unknown) => void;
}

/**
 * Client WebSocket Hyperliquid : abonnements (`subscribe`/`unsubscribe`), dispatch par
 * `channel`, ping/pong, reconnexion avec ré-abonnement, et `post` (requête/réponse par id).
 * Le réseau du socket vient du signer `label` (défaut mainnet) ; les actions signées WS
 * réutilisent ce même signer.
 */
export class WsClient {
  public onMessage: ((message: JsonValue) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onReconnect: (() => void) | null = null;

  private readonly label: string | undefined;
  private readonly url: string;
  private readonly createSocket: WebSocketFactory;
  private readonly heartbeatIntervalMs: number;
  private socket: WebSocketLike | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private postId = 0;
  private readonly pending = new Map<number, PendingPost>();
  private readonly handlers = new Map<string, Set<StreamHandler>>();
  private readonly activeSubscriptions = new Map<string, JsonObject>();
  private shouldReconnect = false;

  constructor(options: WsClientOptions = {}) {
    const config = getConfig();
    this.label = options.label;
    this.url = options.url ?? config.wsUrls[resolveReadNetwork(options.label)];
    this.createSocket = options.webSocket ?? config.webSocket;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 50_000;
  }

  public connect(): Promise<void> {
    this.shouldReconnect = true;
    return new Promise((resolve, reject) => {
      const socket = this.createSocket(this.url);
      this.socket = socket;
      socket.onopen = () => {
        this.startHeartbeat();
        resolve();
      };
      socket.onmessage = (event) => this.handleMessage(event.data);
      socket.onerror = (error) => {
        if (this.onError !== null) {
          this.onError(error);
        }
        reject(error);
      };
      socket.onclose = () => this.handleClose();
    });
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.socket !== null) {
      this.socket.close();
      this.socket = null;
    }
  }

  /** Abonnement brut : `subscription` = `{ type, … }` (ex. `{ type: 'l2Book', coin: 'BTC' }`). */
  public subscribe(subscription: JsonObject, handler: StreamHandler): Unsubscribe {
    const channel = String(subscription.type);
    let handlerSet = this.handlers.get(channel);
    if (handlerSet === undefined) {
      handlerSet = new Set();
      this.handlers.set(channel, handlerSet);
    }
    handlerSet.add(handler);
    this.activeSubscriptions.set(JSON.stringify(subscription), subscription);
    this.send({ method: 'subscribe', subscription });
    return () => {
      handlerSet.delete(handler);
      this.activeSubscriptions.delete(JSON.stringify(subscription));
      this.send({ method: 'unsubscribe', subscription });
    };
  }

  public subscribeAllMids(handler: StreamHandler): Unsubscribe {
    return this.subscribe({ type: 'allMids' }, handler);
  }

  public subscribeL2Book(params: { coin: string }, handler: StreamHandler): Unsubscribe {
    return this.subscribe({ type: 'l2Book', coin: params.coin }, handler);
  }

  public subscribeTrades(params: { coin: string }, handler: StreamHandler): Unsubscribe {
    return this.subscribe({ type: 'trades', coin: params.coin }, handler);
  }

  public subscribeBbo(params: { coin: string }, handler: StreamHandler): Unsubscribe {
    return this.subscribe({ type: 'bbo', coin: params.coin }, handler);
  }

  public subscribeCandle(
    params: { coin: string; interval: string },
    handler: StreamHandler,
  ): Unsubscribe {
    return this.subscribe(
      { type: 'candle', coin: params.coin, interval: params.interval },
      handler,
    );
  }

  public subscribeOrderUpdates(
    params: { user: `0x${string}` },
    handler: StreamHandler,
  ): Unsubscribe {
    return this.subscribe({ type: 'orderUpdates', user: params.user }, handler);
  }

  public subscribeUserFills(params: { user: `0x${string}` }, handler: StreamHandler): Unsubscribe {
    return this.subscribe({ type: 'userFills', user: params.user }, handler);
  }

  public subscribeWebData2(params: { user: `0x${string}` }, handler: StreamHandler): Unsubscribe {
    return this.subscribe({ type: 'webData2', user: params.user }, handler);
  }

  /** Requête/réponse via `post` (id numérique). `request` = `{ type: 'info'|'action', payload }`. */
  public post<TResult extends JsonValue = JsonValue>(
    request: Record<string, unknown>,
  ): Promise<TResult> {
    const id = ++this.postId;
    return new Promise<TResult>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: JsonValue) => void, reject });
      this.send({ method: 'post', id, request });
    });
  }

  /** Signe une action L1 (avec le signer du client) et la poste via le WebSocket. */
  private signedActionRequest<TResult extends JsonValue = JsonValue>(
    action: Record<string, unknown>,
  ): Promise<TResult> {
    const signer = resolveSigner(this.label);
    const nonce = Date.now();
    const signature = signL1Action({
      privateKey: signer.privateKey,
      action,
      nonce,
      isTestnet: signer.network === 'testnet',
      vaultAddress: signer.vaultAddress,
    });
    const payload: Record<string, unknown> = { action, nonce, signature };
    if (signer.vaultAddress !== undefined) {
      payload.vaultAddress = signer.vaultAddress;
    }
    return this.post<TResult>({ type: 'action', payload });
  }

  public createLimitOrder<TResult extends JsonValue = JsonValue>(
    order: OrderParams,
  ): Promise<TResult> {
    return this.signedActionRequest<TResult>(buildOrderAction([order]));
  }

  public createMarketOrder<TResult extends JsonValue = JsonValue>(
    order: Omit<OrderParams, 'tif'>,
  ): Promise<TResult> {
    return this.signedActionRequest<TResult>(buildOrderAction([{ ...order, tif: 'Ioc' }]));
  }

  public cancelOrder<TResult extends JsonValue = JsonValue>(
    cancel: CancelParams,
  ): Promise<TResult> {
    return this.signedActionRequest<TResult>(buildCancelAction([cancel]));
  }

  public editOrder<TResult extends JsonValue = JsonValue>(params: ModifyParams): Promise<TResult> {
    return this.signedActionRequest<TResult>(buildModifyAction(params));
  }

  public startHeartbeat(intervalMs: number = this.heartbeatIntervalMs): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => this.send({ method: 'ping' }), intervalMs);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.socket === null) {
      throw new Error("WebSocket non connecté ; appelle connect() d'abord");
    }
    this.socket.send(JSON.stringify(payload));
  }

  private handleMessage(raw: unknown): void {
    const message = JSON.parse(String(raw)) as JsonValue;
    if (this.onMessage !== null) {
      this.onMessage(message);
    }
    if (typeof message !== 'object' || message === null || Array.isArray(message) === true) {
      return;
    }
    const channel = message.channel;
    if (channel === 'pong') {
      return;
    }
    if (channel === 'post') {
      this.handlePost(message.data ?? null);
      return;
    }
    if (typeof channel === 'string' && channel !== 'subscriptionResponse') {
      this.dispatch(channel, message.data ?? null);
    }
  }

  private handlePost(data: JsonValue): void {
    if (typeof data !== 'object' || data === null || Array.isArray(data) === true) {
      return;
    }
    const id = data.id;
    if (typeof id !== 'number') {
      return;
    }
    const pendingPost = this.pending.get(id);
    if (pendingPost !== undefined) {
      this.pending.delete(id);
      pendingPost.resolve(data.response ?? null);
    }
  }

  private dispatch(channel: string, data: JsonValue): void {
    const handlerSet = this.handlers.get(channel);
    if (handlerSet !== undefined) {
      for (const handler of handlerSet) {
        handler(data);
      }
    }
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.socket = null;
    if (this.onClose !== null) {
      this.onClose();
    }
    if (this.shouldReconnect === true) {
      this.reconnect();
    }
  }

  private reconnect(): void {
    this.connect()
      .then(() => {
        for (const subscription of this.activeSubscriptions.values()) {
          this.send({ method: 'subscribe', subscription });
        }
        if (this.onReconnect !== null) {
          this.onReconnect();
        }
      })
      .catch((error: unknown) => {
        if (this.onError !== null) {
          this.onError(error);
        }
      });
  }
}
