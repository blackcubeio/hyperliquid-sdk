import type { HyperliquidClient, WebSocketFactory, WebSocketLike } from '../common/config';
import {
  ACTION_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  RECONNECT_BASE_MS,
  RECONNECT_CAP_MS,
  RECONNECT_FACTOR,
  RECONNECT_JITTER,
  RECONNECT_STABLE_MS,
  WS_SUB_CHUNK,
  WS_SUB_INTERVAL_MS,
} from '../common/constants';
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
import { SubscriptionBatcher } from './subscription-batcher';

interface PendingPost {
  resolve: (value: JsonValue) => void;
  reject: (reason: unknown) => void;
  /** Timeout individuel : rejette la requête si aucune réponse n'arrive (socket vivante muette). */
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Client WebSocket Hyperliquid : abonnements (`subscribe`/`unsubscribe`), dispatch par
 * `channel`, ping/pong, reconnexion avec ré-abonnement, et `post` (requête/réponse par id).
 * Le réseau du socket vient du signer `label` (défaut mainnet) ; les actions signées WS
 * réutilisent ce même signer.
 *
 * Robustesse (spec commune aux 4 SDK) : reconnexion à backoff exponentiel plafonné + jitter,
 * reset du compteur après stabilité, re-subscribe automatique, heartbeat + idle-timeout,
 * rejet des `post` en vol au close + timeout par requête, parsing défensif, throttle d'émission
 * des (dé)abonnements via {@link SubscriptionBatcher}. Toute la mécanique est **interne** :
 * l'API publique (`subscribeX`, `Unsubscribe`, `post`) ne change pas.
 */
export class WsClient {
  public onMessage: ((message: JsonValue) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onReconnect: (() => void) | null = null;

  private readonly client: HyperliquidClient;
  private readonly label: string | undefined;
  private readonly url: string;
  private readonly createSocket: WebSocketFactory;
  private readonly heartbeatIntervalMs: number;
  private socket: WebSocketLike | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private postId = 0;
  private readonly pendingPosts = new Map<number, PendingPost>();
  private readonly handlers = new Map<string, Set<StreamHandler>>();
  private readonly activeSubscriptions = new Map<string, JsonObject>();
  private readonly batcher: SubscriptionBatcher;
  private shouldReconnect = false;
  /** Messages émis avant l'ouverture du socket, rejoués à `onopen` (connexion paresseuse). */
  private pending: string[] = [];
  private open = false;

  constructor(client: HyperliquidClient, options: WsClientOptions = {}) {
    this.client = client;
    this.label = options.label;
    this.url = options.url ?? client.wsUrls[resolveReadNetwork(client, options.label)];
    this.createSocket = options.webSocket ?? client.webSocket;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? HEARTBEAT_INTERVAL_MS;
    // 1 subscription HL par message `{ method:'subscribe', subscription }` ; la clé est le
    // `JSON.stringify(subscription)` déjà utilisé comme clé d'`activeSubscriptions`.
    this.batcher = new SubscriptionBatcher(
      (frame) => this.rawSend(frame),
      (names) => ({ method: 'subscribe', subscription: JSON.parse(names[0] as string) }),
      (names) => ({ method: 'unsubscribe', subscription: JSON.parse(names[0] as string) }),
      WS_SUB_CHUNK,
      WS_SUB_INTERVAL_MS,
    );
  }

  public connect(): Promise<void> {
    this.shouldReconnect = true;
    return new Promise((resolve, reject) => {
      const socket = this.createSocket(this.url);
      this.socket = socket;
      socket.onopen = () => {
        this.open = true;
        this.batcher.setOpen(true);
        for (const payload of this.pending) {
          socket.send(payload);
        }
        this.pending = [];
        this.startHeartbeat();
        this.bumpIdle();
        // Reset du compteur de backoff seulement après une connexion stable (évite la boucle
        // 500 ms d'une socket qui claque immédiatement).
        this.stableTimer = setTimeout(() => {
          this.reconnectAttempts = 0;
          this.stableTimer = null;
        }, RECONNECT_STABLE_MS);
        resolve();
      };
      socket.onmessage = (event) => this.handleMessage(event.data);
      socket.onerror = (error) => {
        if (this.onError !== null) {
          this.onError(error);
        }
        this.rejectAllPending('WebSocket fermé : requête en vol annulée');
        reject(error);
      };
      socket.onclose = () => this.handleClose();
    });
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.open = false;
    this.pending = [];
    this.stopHeartbeat();
    this.stopIdleTimer();
    if (this.stableTimer !== null) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending('WebSocket fermé : requête en vol annulée');
    this.batcher.reset();
    this.batcher.setOpen(false);
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
    const key = JSON.stringify(subscription);
    this.activeSubscriptions.set(key, subscription);
    this.batcher.subscribe(key);
    return () => {
      handlerSet.delete(handler);
      this.activeSubscriptions.delete(key);
      this.batcher.unsubscribe(key);
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
      const timer = setTimeout(() => {
        this.pendingPosts.delete(id);
        reject(new Error('WebSocket : délai dépassé en attente de la réponse'));
      }, ACTION_TIMEOUT_MS);
      this.pendingPosts.set(id, {
        resolve: resolve as (value: JsonValue) => void,
        reject,
        timer,
      });
      this.send({ method: 'post', id, request });
    });
  }

  /** Signe une action L1 (avec le signer du client) et la poste via le WebSocket. */
  private signedActionRequest<TResult extends JsonValue = JsonValue>(
    action: Record<string, unknown>,
  ): Promise<TResult> {
    const signer = resolveSigner(this.client, this.label);
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

  public startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ method: 'ping' });
    }, this.heartbeatIntervalMs);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private stopIdleTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** Marque l'activité reçue ; arme le timer d'inactivité (reconnect forcé si silence). */
  private bumpIdle(): void {
    this.stopIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.forceReconnect();
    }, IDLE_TIMEOUT_MS);
  }

  /** Coupe la socket : `onclose` → `handleClose` → `scheduleReconnect`. */
  private forceReconnect(): void {
    if (this.socket !== null) {
      this.socket.close();
    }
  }

  /** Rejette toutes les requêtes `post` en vol (close/erreur socket) : jamais de hang. */
  private rejectAllPending(reason: string): void {
    if (this.pendingPosts.size === 0) {
      return;
    }
    const error = new Error(reason);
    for (const pending of this.pendingPosts.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingPosts.clear();
  }

  /** Émission immédiate sur la socket si ouverte, sinon mise en file (rejouée à `onopen`). */
  private rawSend(serialized: string): void {
    if (this.socket === null || this.open === false) {
      this.pending.push(serialized);
      return;
    }
    this.socket.send(serialized);
  }

  private send(payload: Record<string, unknown>): void {
    this.rawSend(JSON.stringify(payload));
  }

  private handleMessage(raw: unknown): void {
    this.bumpIdle();
    let message: JsonValue;
    try {
      message = JSON.parse(String(raw)) as JsonValue;
    } catch {
      if (this.onError !== null) {
        this.onError(new Error('WebSocket : message JSON illisible ignoré'));
      }
      return;
    }
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
    const pendingPost = this.pendingPosts.get(id);
    if (pendingPost !== undefined) {
      this.pendingPosts.delete(id);
      clearTimeout(pendingPost.timer);
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
    this.stopIdleTimer();
    if (this.stableTimer !== null) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
    this.rejectAllPending('WebSocket fermé : requête en vol annulée');
    this.batcher.reset();
    this.batcher.setOpen(false);
    this.socket = null;
    this.open = false;
    if (this.onClose !== null) {
      this.onClose();
    }
    if (this.shouldReconnect === true) {
      this.scheduleReconnect();
    }
  }

  /** Planifie une reconnexion : backoff exponentiel plafonné + jitter ; re-arm dans le `.catch`. */
  private scheduleReconnect(): void {
    if (this.shouldReconnect === false) {
      return;
    }
    const capped = Math.min(
      RECONNECT_BASE_MS * RECONNECT_FACTOR ** this.reconnectAttempts,
      RECONNECT_CAP_MS,
    );
    const jitter = capped * RECONNECT_JITTER * (2 * Math.random() - 1);
    const delay = Math.max(0, Math.round(capped + jitter));
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect()
        .then(() => this.afterReconnect())
        .catch((error: unknown) => {
          if (this.onError !== null) {
            this.onError(error);
          }
          // Ré-essaie avec le délai suivant (compteur déjà incrémenté) : on ne lâche jamais
          // tant que `shouldReconnect === true`.
          this.scheduleReconnect();
        });
    }, delay);
  }

  /** Après reconnexion : rejoue tous les abonnements vivants puis notifie. */
  private afterReconnect(): void {
    this.batcher.resubscribe(this.activeSubscriptions.keys());
    if (this.onReconnect !== null) {
      this.onReconnect();
    }
  }
}
