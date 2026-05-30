import { type HyperliquidClient, type InitOptions, init } from '../common/config';
import type {
  Balance,
  Candle,
  FundingRate,
  Hex,
  MarketKind,
  Order,
  OrderBook,
  Pair,
  Position,
  Price,
  Signer,
  Trade,
  UserTrade,
} from '../common/types';
import { assetIndex } from '../common/utils';
import { cancelAllOrders } from '../rest/cancel-all-orders';
import { cancelOrder } from '../rest/cancel-order';
import { editOrder } from '../rest/edit-order';
import { approveAgent } from '../rest/exchange/approve-agent';
import { scheduleCancel } from '../rest/exchange/schedule-cancel';
import { spotSend } from '../rest/exchange/spot-send';
import { updateIsolatedMargin } from '../rest/exchange/update-isolated-margin';
import { usdClassTransfer } from '../rest/exchange/usd-class-transfer';
import { usdSend } from '../rest/exchange/usd-send';
import { withdraw } from '../rest/exchange/withdraw';
import { getBalances } from '../rest/get-balances';
import { getCandles } from '../rest/get-candles';
import { getFundingHistory } from '../rest/get-funding-history';
import { getOpenOrders } from '../rest/get-open-orders';
import { getOrderBook } from '../rest/get-order-book';
import { getPairs } from '../rest/get-pairs';
import { getPositions } from '../rest/get-positions';
import { getPrices } from '../rest/get-prices';
import { getUserTrades } from '../rest/get-user-trades';
import { getClearinghouseState } from '../rest/info/get-clearinghouse-state';
import { getClearinghouseStateSpot } from '../rest/info/get-clearinghouse-state-spot';
import { getMeta } from '../rest/info/get-meta';
import { getMetaSpot } from '../rest/info/get-meta-spot';
import { placeOrder } from '../rest/place-order';
import { keyTypeOf, privateKeyToAddress, toChecksumAddress } from '../rest/signing';
import { updateLeverage } from '../rest/update-leverage';
import { UnifiedWsClient } from '../ws/unified-client';
import type {
  CancelAllInput,
  CancelOrderInput,
  CandlesQuery,
  EditOrderInput,
  EvmHelper,
  FundingQuery,
  IAccount,
  IDeadManSwitch,
  IIsolatedMargin,
  IMarginMode,
  IMarketData,
  IMarketMeta,
  IProductAccount,
  IRealtime,
  IRemovableMargin,
  ITrading,
  IsolatedMarginInput,
  KeyHelper,
  LeverageInput,
  MarginModeInput,
  OrderBookQuery,
  PlaceOrderInput,
  SymbolQuery,
  WithdrawInput,
} from './contract';

/** Options de construction d'un {@link Hyperliquid}. */
export interface HyperliquidDexOptions extends Omit<InitOptions, 'signers'> {
  /** Label du signer par défaut (sinon le 1er du registre). */
  default?: string;
}

/** Unités d'intervalle → millisecondes, pour borner `startTime` quand seul `limit` est fourni. */
const UNIT_MS: Record<string, number> = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  M: 2_592_000_000,
};

function intervalToMs(interval: string): number {
  const match = /^(\d+)([mhdwM])$/.exec(interval);
  if (match === null) {
    return 60_000;
  }
  return Number(match[1]) * (UNIT_MS[match[2] as string] ?? 60_000);
}

/**
 * Scope **marché** (perp ou spot) lié à un `kind` et un `label`. Les params n'ont pas de
 * `kind` : il est porté par le scope (Hyperliquid le déduit aussi du nom du coin). Hyperliquid
 * n'a **pas** de trades publics REST ni d'historique d'ordres : la classe n'implémente donc ni
 * `IPublicTrades` ni `IOrderHistory`.
 */
class HyperliquidMarket
  implements
    IMarketData,
    IMarketMeta,
    IProductAccount,
    ITrading,
    IMarginMode,
    IIsolatedMargin,
    IRemovableMargin
{
  private get spotScope(): boolean {
    return this.kind === 'spot';
  }

  constructor(
    private readonly client: HyperliquidClient,
    private readonly kind: MarketKind,
    private readonly label: string | undefined,
  ) {}

  /** Label requis pour une action signée. */
  private signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  /** Adresse réelle du compte (requise par HL pour les lectures de compte). */
  private user(): string {
    const signer = this.client.signers[this.signed()];
    if (signer === undefined) {
      throw new Error(`Aucun signer enregistré sous "${this.label}".`);
    }
    return signer.publicKey;
  }

  // ── IMarketData ──
  public getPairs(): Promise<Pair[]> {
    return getPairs(this.client, this.label).then((pairs) =>
      pairs.filter((pair) => pair.kind === this.kind),
    );
  }
  public getCandles(query: CandlesQuery): Promise<Candle[]> {
    const startTime =
      query.startTime ?? Date.now() - (query.limit ?? 500) * intervalToMs(query.interval);
    return getCandles(
      this.client,
      {
        name: query.name,
        interval: query.interval,
        startTime,
        endTime: query.endTime,
        limit: query.limit,
        kind: this.kind,
      },
      this.label,
    );
  }
  public getOrderBook(query: OrderBookQuery): Promise<OrderBook> {
    return getOrderBook(
      this.client,
      { name: query.name, limit: query.limit, kind: this.kind },
      this.label,
    );
  }
  public getPrices(): Promise<Price[]> {
    return getPrices(this.client, this.label);
  }
  public getFundingHistory(query: FundingQuery): Promise<FundingRate[]> {
    return getFundingHistory(
      this.client,
      { name: query.name, startTime: query.startTime ?? 0, endTime: query.endTime },
      this.label,
    );
  }

  // ── IMarketMeta ──
  public getExchangeInfo(): Promise<unknown> {
    return this.spotScope
      ? getMetaSpot(this.client, this.label)
      : getMeta(this.client, undefined, this.label);
  }

  // ── IProductAccount ──
  public getPositions(query?: SymbolQuery): Promise<Position[]> {
    return getPositions(this.client, { user: this.user(), name: query?.name }, this.signed());
  }
  public getOpenOrders(query?: SymbolQuery): Promise<Order[]> {
    return getOpenOrders(this.client, { user: this.user(), name: query?.name }, this.signed());
  }
  public getUserTrades(query?: SymbolQuery): Promise<UserTrade[]> {
    return getUserTrades(this.client, { user: this.user(), name: query?.name }, this.signed());
  }
  public getAccountInfo(): Promise<unknown> {
    const user = this.user() as Hex;
    return this.spotScope
      ? getClearinghouseStateSpot(this.client, { user }, this.signed())
      : getClearinghouseState(this.client, { user }, this.signed());
  }

  // ── ITrading ──
  public placeOrder(input: PlaceOrderInput): Promise<Order> {
    if (input.type !== 'limit' && input.type !== 'market') {
      throw new Error(
        `placeOrder (Hyperliquid) : type "${input.type}" non supporté (limit/market).`,
      );
    }
    if (input.price === undefined) {
      throw new Error(
        'placeOrder (Hyperliquid) : `price` est requis (limite ou borne de slippage).',
      );
    }
    return placeOrder(
      this.client,
      {
        name: input.name,
        side: input.side,
        type: input.type,
        size: input.size,
        price: input.price,
        tif: input.tif,
        reduceOnly: input.reduceOnly,
        clientId: input.clientId as Hex | undefined,
        kind: this.kind,
      },
      this.signed(),
    );
  }
  public cancelOrder(input: CancelOrderInput): Promise<void> {
    if (input.id === undefined) {
      throw new Error('cancelOrder (Hyperliquid) : `id` (oid) est requis.');
    }
    return cancelOrder(
      this.client,
      { name: input.name, id: input.id, kind: this.kind },
      this.signed(),
    );
  }
  public cancelAllOrders(input: CancelAllInput): Promise<{ cancelled: number | null }> {
    return cancelAllOrders(
      this.client,
      { user: this.user(), name: input.name, kind: this.kind },
      this.signed(),
    );
  }
  public editOrder(input: EditOrderInput): Promise<{ name: string; id: string }> {
    if (input.id === undefined) {
      throw new Error('editOrder (Hyperliquid) : `id` (oid) est requis.');
    }
    if (input.price === undefined) {
      throw new Error('editOrder (Hyperliquid) : `price` est requis.');
    }
    return editOrder(
      this.client,
      {
        name: input.name,
        id: input.id,
        side: input.side,
        size: input.size,
        price: input.price,
        kind: this.kind,
      },
      this.signed(),
    ).then((result) => ({ name: result.name, id: result.id }));
  }
  public updateLeverage(input: LeverageInput): Promise<unknown> {
    return updateLeverage(
      this.client,
      { name: input.name, leverage: input.leverage },
      this.signed(),
    );
  }

  // ── IMarginMode : HL couple mode + levier ; on cache la mécanique dans la méthode ──
  // updateLeverage(asset, isCross, leverage) est la seule action HL pour le mode de marge.
  // On préserve le levier courant (lu sur la position) ; sans position le levier courant n'est
  // pas lisible → on retombe sur 1× (conservateur). Le levier appliqué est renvoyé dans `xtras`.
  public setMarginMode(input: MarginModeInput): Promise<void> {
    return this.getPositions({ name: input.name }).then((positions) => {
      const leverage = positions.find((p) => p.name === input.name)?.leverage ?? 1;
      return updateLeverage(
        this.client,
        { name: input.name, leverage, isCross: input.isolated === false },
        this.signed(),
      ).then(() => undefined);
    });
  }

  // ── IIsolatedMargin / IRemovableMargin ──
  public addIsolatedMargin(input: IsolatedMarginInput): Promise<void> {
    return this.adjustIsolatedMargin(input, 1);
  }
  public removeIsolatedMargin(input: IsolatedMarginInput): Promise<void> {
    return this.adjustIsolatedMargin(input, -1);
  }
  private adjustIsolatedMargin(input: IsolatedMarginInput, sign: 1 | -1): Promise<void> {
    return Promise.all([
      getMeta(this.client, undefined, this.label),
      this.getPositions({ name: input.name }),
    ]).then(([meta, positions]) => {
      const asset = assetIndex(meta.universe, input.name);
      const isBuy = positions.find((p) => p.name === input.name)?.side !== 'short';
      const ntli = sign * Math.round(Number(input.amount) * 1e6);
      return updateIsolatedMargin(this.client, { asset, isBuy, ntli }, this.signed()).then(
        () => undefined,
      );
    });
  }
}

/** Scope **compte transverse** (sans produit) : soldes, retrait. HL n'expose pas de liste de
 * sous-comptes → pas de `ISubAccounts`. */
class HyperliquidAccount implements IAccount, IDeadManSwitch {
  constructor(
    private readonly client: HyperliquidClient,
    private readonly label: string | undefined,
  ) {}

  private signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  private user(): string {
    const signer = this.client.signers[this.signed()];
    if (signer === undefined) {
      throw new Error(`Aucun signer enregistré sous "${this.label}".`);
    }
    return signer.publicKey;
  }

  public getBalances(): Promise<Balance[]> {
    return getBalances(this.client, { user: this.user() }, this.signed());
  }
  public withdraw(input: WithdrawInput): Promise<unknown> {
    return withdraw(this.client, { amount: input.amount, address: input.address }, this.signed());
  }

  // ── IDeadManSwitch (HL : scheduleCancel, échéance = timestamp absolu ms) ──
  public armCancelAll(afterMs: number): Promise<unknown> {
    return scheduleCancel(this.client, { time: Date.now() + afterMs }, this.signed());
  }
  public disarm(): Promise<unknown> {
    return scheduleCancel(this.client, {}, this.signed());
  }
}

// Hyperliquid n'expose ni ping ni horloge serveur publics → pas de scope `system()`
// (capacité `ISystem` non implémentée, conforme à la ségrégation par capacité).

/** Helpers crypto Hyperliquid : **EVM uniquement** (pas de Solana). */
class HyperliquidHelpers implements KeyHelper, EvmHelper {
  public keyTypeOf(privateKey: string): 'evm' | 'solana' {
    return keyTypeOf(privateKey);
  }
  public privateKeyToAddress(privateKey: string): string {
    return privateKeyToAddress(privateKey as Hex);
  }
  public toChecksumAddress(address: string): string {
    return toChecksumAddress(address);
  }
}

/**
 * Scope **temps réel** lié à un `label`. `kind` porté par les méthodes (perp/spot). HL n'a pas
 * de flux de positions dédié → pas de `IRealtimePositions`. Les flux user-data (`subscribeOrders`,
 * `subscribeUserTrades`) requièrent l'adresse du compte, résolue depuis le signer.
 */
class HyperliquidRealtime implements IRealtime {
  constructor(
    private readonly ws: UnifiedWsClient,
    private readonly kind: MarketKind,
    private readonly user: string | undefined,
  ) {}

  public subscribeCandles(query: { name: string; interval: string }, cb: (c: Candle) => void) {
    return this.ws.subscribeCandles({ ...query, kind: this.kind }, cb);
  }
  public subscribeOrderBook(query: { name: string }, cb: (b: OrderBook) => void) {
    return this.ws.subscribeOrderBook({ ...query, kind: this.kind }, cb);
  }
  public subscribeTrades(query: { name: string }, cb: (t: Trade) => void) {
    return this.ws.subscribeTrades(query, cb);
  }
  public subscribeBbo(query: { name: string }, cb: (b: OrderBook) => void) {
    return this.ws.subscribeBbo({ ...query, kind: this.kind }, cb);
  }
  public subscribePrices(cb: (p: Price[]) => void) {
    return this.ws.subscribePrices(cb);
  }
  public subscribeOrders(cb: (o: Order) => void) {
    return this.ws.subscribeOrders({ user: this.user }, cb);
  }
  public subscribeUserTrades(cb: (t: UserTrade) => void) {
    return this.ws.subscribeUserTrades({ user: this.user }, cb);
  }
}

/**
 * Scope **transferts** (spécifique Hyperliquid, hors contrat commun) : mouvements de fonds
 * internes signés en EIP-712 user-signed.
 */
class HyperliquidTransfers {
  constructor(
    private readonly client: HyperliquidClient,
    private readonly label: string | undefined,
  ) {}

  private signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  /** Transfert USDC vers un autre compte Hyperliquid. */
  public usdSend(input: { destination: `0x${string}`; amount: string }): Promise<unknown> {
    return usdSend(this.client, input, this.signed());
  }
  /** Transfert USDC entre le wallet perp et le wallet spot. */
  public usdClassTransfer(input: { amount: string; toPerp: boolean }): Promise<unknown> {
    return usdClassTransfer(this.client, input, this.signed());
  }
  /** Transfert d'un token spot vers un autre compte. */
  public spotSend(input: {
    destination: `0x${string}`;
    token: string;
    amount: string;
  }): Promise<unknown> {
    return spotSend(this.client, input, this.signed());
  }
}

/**
 * Scope **agent** (spécifique Hyperliquid, hors contrat commun) : autorisation d'API wallet et
 * dead-man's switch (`scheduleCancel`).
 */
class HyperliquidAgent {
  constructor(
    private readonly client: HyperliquidClient,
    private readonly label: string | undefined,
  ) {}

  private signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  /** Autorise une API/agent wallet à signer pour le compte. */
  public approveAgent(input: {
    agentAddress: `0x${string}`;
    agentName?: string;
  }): Promise<unknown> {
    return approveAgent(this.client, input, this.signed());
  }
  /** Programme (ou désactive avec `time` omis) l'annulation automatique de tous les ordres. */
  public scheduleCancel(input: { time?: number } = {}): Promise<unknown> {
    return scheduleCancel(this.client, input, this.signed());
  }
}

/**
 * Façade **Hyperliquid** : `const dex = new Hyperliquid({ deskA: signer }, { default: 'deskA' })`,
 * puis `dex.perp(label?)` / `dex.spot(label?)` (marché), `dex.account(label?)` (compte),
 * `dex.ws(label?)` (temps réel). `label` absent → signer par défaut.
 *
 * Chaque instance détient son propre {@link HyperliquidClient} (config isolée) : plusieurs
 * `Hyperliquid` (comptes/réseaux différents) coexistent sans état global partagé.
 */
export class Hyperliquid {
  private readonly client: HyperliquidClient;
  private readonly defaultLabel: string | undefined;
  private wsClients = new Map<string, UnifiedWsClient>();

  constructor(signers: Record<string, Signer> = {}, options: HyperliquidDexOptions = {}) {
    const { default: defaultLabel, ...init0 } = options;
    this.client = init({ ...init0, signers });
    this.defaultLabel = defaultLabel ?? Object.keys(signers)[0];
  }

  private resolve(label?: string): string | undefined {
    return label ?? this.defaultLabel;
  }

  /** Scope marché **perp**. */
  public perp(label?: string): HyperliquidMarket {
    return new HyperliquidMarket(this.client, 'perp', this.resolve(label));
  }

  /** Scope marché **spot** (HL déduit le spot du nom du coin : `BASE/QUOTE` ou `@index`). */
  public spot(label?: string): HyperliquidMarket {
    return new HyperliquidMarket(this.client, 'spot', this.resolve(label));
  }

  /** Scope **compte** transverse (soldes, retrait). */
  public account(label?: string): HyperliquidAccount {
    return new HyperliquidAccount(this.client, this.resolve(label));
  }

  /** Helpers crypto (EVM). */
  public helpers(): HyperliquidHelpers {
    return new HyperliquidHelpers();
  }

  /** Scope **temps réel** perp (cf. {@link wsSpot} pour le spot). */
  public ws(label?: string): HyperliquidRealtime {
    const resolved = this.resolve(label);
    return new HyperliquidRealtime(this.unifiedWs(resolved), 'perp', this.userOf(resolved));
  }

  /** Scope **temps réel** spot. */
  public wsSpot(label?: string): HyperliquidRealtime {
    const resolved = this.resolve(label);
    return new HyperliquidRealtime(this.unifiedWs(resolved), 'spot', this.userOf(resolved));
  }

  /** Scope **transferts** (spécifique HL). */
  public transfers(label?: string): HyperliquidTransfers {
    return new HyperliquidTransfers(this.client, this.resolve(label));
  }

  /** Scope **agent** (spécifique HL). */
  public agent(label?: string): HyperliquidAgent {
    return new HyperliquidAgent(this.client, this.resolve(label));
  }

  /** Adresse du compte associée à un label (pour les flux user-data WS). */
  private userOf(label: string | undefined): string | undefined {
    if (label === undefined) {
      return undefined;
    }
    return this.client.signers[label]?.publicKey;
  }

  /** Un client WS unifié par label (réutilisé pour partager le ref-counting du socket). */
  private unifiedWs(label: string | undefined): UnifiedWsClient {
    const key = label ?? '';
    let ws = this.wsClients.get(key);
    if (ws === undefined) {
      ws = new UnifiedWsClient(this.client, label);
      this.wsClients.set(key, ws);
    }
    return ws;
  }
}
