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
import { approveBuilderFee } from '../rest/exchange/approve-builder-fee';
import { cDeposit } from '../rest/exchange/c-deposit';
import { cWithdraw } from '../rest/exchange/c-withdraw';
import { cancelOrdersByCloid } from '../rest/exchange/cancel-by-cloid';
import { cancelOrders } from '../rest/exchange/cancel-order';
import { createSubAccount } from '../rest/exchange/create-sub-account';
import { createVault } from '../rest/exchange/create-vault';
// ── Surplus spécifique HL (namespace native) ──
import { batchModifyOrders } from '../rest/exchange/modify-order';
import { placeOrders } from '../rest/exchange/place-order';
import { scheduleCancel } from '../rest/exchange/schedule-cancel';
import { sendAsset } from '../rest/exchange/send-asset';
import { setReferrer } from '../rest/exchange/set-referrer';
import { spotSend } from '../rest/exchange/spot-send';
import { subAccountModify } from '../rest/exchange/sub-account-modify';
import { subAccountSpotTransfer } from '../rest/exchange/sub-account-spot-transfer';
import { subAccountTransfer } from '../rest/exchange/sub-account-transfer';
import { tokenDelegate } from '../rest/exchange/token-delegate';
import { twapCancel } from '../rest/exchange/twap-cancel';
import { twapOrder } from '../rest/exchange/twap-order';
import { updateIsolatedMargin } from '../rest/exchange/update-isolated-margin';
import { usdClassTransfer } from '../rest/exchange/usd-class-transfer';
import { usdSend } from '../rest/exchange/usd-send';
import { vaultDistribute } from '../rest/exchange/vault-distribute';
import { vaultModify } from '../rest/exchange/vault-modify';
import { vaultTransfer } from '../rest/exchange/vault-transfer';
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
import { getAllMids } from '../rest/info/get-all-mids';
import { getCandleSnapshot } from '../rest/info/get-candle-snapshot';
import { getClearinghouseState } from '../rest/info/get-clearinghouse-state';
import { getClearinghouseStateSpot } from '../rest/info/get-clearinghouse-state-spot';
import { getDelegations } from '../rest/info/get-delegations';
import { getDelegatorHistory } from '../rest/info/get-delegator-history';
import { getDelegatorRewards } from '../rest/info/get-delegator-rewards';
import { getDelegatorSummary } from '../rest/info/get-delegator-summary';
import { getFrontendOpenOrders } from '../rest/info/get-frontend-open-orders';
import { getHistoricalOrders } from '../rest/info/get-historical-orders';
import { getMaxBuilderFee } from '../rest/info/get-max-builder-fee';
import { getMeta } from '../rest/info/get-meta';
import { getMetaAndAssetCtxs } from '../rest/info/get-meta-and-asset-ctxs';
import { getMetaAndAssetCtxsSpot } from '../rest/info/get-meta-and-asset-ctxs-spot';
import { getMetaSpot } from '../rest/info/get-meta-spot';
import { getOrderStatus } from '../rest/info/get-order-status';
import { getPerpDexs } from '../rest/info/get-perp-dexs';
import { getPortfolio } from '../rest/info/get-portfolio';
import { getPredictedFundings } from '../rest/info/get-predicted-fundings';
import { getReferral } from '../rest/info/get-referral';
import { getSubAccounts } from '../rest/info/get-sub-accounts';
import { getUserFees } from '../rest/info/get-user-fees';
import { getUserFillsByTime } from '../rest/info/get-user-fills-by-time';
import { getUserFunding } from '../rest/info/get-user-funding';
import { getUserNonFundingLedgerUpdates } from '../rest/info/get-user-non-funding-ledger-updates';
import { getUserRateLimit } from '../rest/info/get-user-rate-limit';
import { getUserRole } from '../rest/info/get-user-role';
import { getUserTwapSliceFills } from '../rest/info/get-user-twap-slice-fills';
import { getUserVaultEquities } from '../rest/info/get-user-vault-equities';
import { getVaultDetails } from '../rest/info/get-vault-details';
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
import type {
  IAccountExtra,
  IAdvancedOrders,
  IAgents,
  IBuilderFee,
  IMarketDataExtra,
  IReferral,
  IStaking,
  ISubAccountsAdmin,
  ITransfers,
  ITwap,
  IVaults,
} from './native-contract';

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
// ── Surplus spécifique Hyperliquid (namespace `native`, convention partagée par les 4 SDK) ──

/** Base des scopes `native` : résolution du label (lectures privées via `signed()`). */
class HyperliquidNativeScope {
  constructor(
    protected readonly client: HyperliquidClient,
    protected readonly label: string | undefined,
  ) {}

  protected signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  /** Adresse réelle du compte (requise par HL pour les lectures par adresse). */
  protected user(): `0x${string}` {
    const signer = this.client.signers[this.signed()];
    if (signer === undefined) {
      throw new Error(`Aucun signer enregistré sous "${this.label}".`);
    }
    return signer.publicKey as `0x${string}`;
  }
}

/** Agents (API wallets). Le dead-man's switch est unifié sous `account().armCancelAll()`. */
class HyperliquidAgentsScope extends HyperliquidNativeScope implements IAgents {
  public approve(params: Parameters<typeof approveAgent>[1]) {
    return approveAgent(this.client, params, this.signed());
  }
}

/** Transferts : USDC, bascule perp↔spot, token spot. */
class HyperliquidTransfersScope extends HyperliquidNativeScope implements ITransfers {
  public usdSend(params: Parameters<typeof usdSend>[1]) {
    return usdSend(this.client, params, this.signed());
  }
  public usdClassTransfer(params: Parameters<typeof usdClassTransfer>[1]) {
    return usdClassTransfer(this.client, params, this.signed());
  }
  public spotSend(params: Parameters<typeof spotSend>[1]) {
    return spotSend(this.client, params, this.signed());
  }
  public sendAsset(params: Parameters<typeof sendAsset>[1]) {
    return sendAsset(this.client, params, this.signed());
  }
}

/** Sous-comptes : création, transferts (perp/spot) master↔sous-compte, renommage, liste. */
class HyperliquidSubAccountsScope extends HyperliquidNativeScope implements ISubAccountsAdmin {
  public create(params: Parameters<typeof createSubAccount>[1]) {
    return createSubAccount(this.client, params, this.signed());
  }
  public transfer(params: Parameters<typeof subAccountTransfer>[1]) {
    return subAccountTransfer(this.client, params, this.signed());
  }
  public spotTransfer(params: Parameters<typeof subAccountSpotTransfer>[1]) {
    return subAccountSpotTransfer(this.client, params, this.signed());
  }
  public modify(params: Parameters<typeof subAccountModify>[1]) {
    return subAccountModify(this.client, params, this.signed());
  }
  public list() {
    return getSubAccounts(this.client, { user: this.user() }, this.signed());
  }
}

/** Données de marché supplémentaires : **publiques** (label optionnel). */
class HyperliquidMarketDataScope extends HyperliquidNativeScope implements IMarketDataExtra {
  public allMids(dex?: string) {
    return getAllMids(this.client, dex, this.label);
  }
  public candleSnapshot(params: Parameters<typeof getCandleSnapshot>[1]) {
    return getCandleSnapshot(this.client, params, this.label);
  }
  public metaAndAssetCtxs() {
    return getMetaAndAssetCtxs(this.client, this.label);
  }
  public metaAndAssetCtxsSpot() {
    return getMetaAndAssetCtxsSpot(this.client, this.label);
  }
  public frontendOpenOrders(params: Parameters<typeof getFrontendOpenOrders>[1]) {
    return getFrontendOpenOrders(this.client, params, this.label);
  }
  public predictedFundings() {
    return getPredictedFundings(this.client, this.label);
  }
  public perpDexs() {
    return getPerpDexs(this.client, this.label);
  }
}

/** Vaults : dépôt/retrait, création, réglages, distribution, lectures. */
class HyperliquidVaultsScope extends HyperliquidNativeScope implements IVaults {
  public transfer(params: Parameters<typeof vaultTransfer>[1]) {
    return vaultTransfer(this.client, params, this.signed());
  }
  public create(params: Parameters<typeof createVault>[1]) {
    return createVault(this.client, params, this.signed());
  }
  public modify(params: Parameters<typeof vaultModify>[1]) {
    return vaultModify(this.client, params, this.signed());
  }
  public distribute(params: Parameters<typeof vaultDistribute>[1]) {
    return vaultDistribute(this.client, params, this.signed());
  }
  public details(params: Parameters<typeof getVaultDetails>[1]) {
    return getVaultDetails(this.client, params, this.label);
  }
  public equities() {
    return getUserVaultEquities(this.client, { user: this.user() }, this.signed());
  }
}

/** TWAP : placement, annulation, fills des slices. */
class HyperliquidTwapScope extends HyperliquidNativeScope implements ITwap {
  public place(params: Parameters<typeof twapOrder>[1]) {
    return twapOrder(this.client, params, this.signed());
  }
  public cancel(params: Parameters<typeof twapCancel>[1]) {
    return twapCancel(this.client, params, this.signed());
  }
  public sliceFills() {
    return getUserTwapSliceFills(this.client, { user: this.user() }, this.signed());
  }
}

/** Parrainage : code (une seule fois), lecture de l'état. */
class HyperliquidReferralScope extends HyperliquidNativeScope implements IReferral {
  public set(params: Parameters<typeof setReferrer>[1]) {
    return setReferrer(this.client, params, this.signed());
  }
  public info() {
    return getReferral(this.client, { user: this.user() }, this.signed());
  }
}

/** Builder fee : autorisation, lecture du fee max approuvé. */
class HyperliquidBuilderFeeScope extends HyperliquidNativeScope implements IBuilderFee {
  public approve(params: Parameters<typeof approveBuilderFee>[1]) {
    return approveBuilderFee(this.client, params, this.signed());
  }
  public max(params: Parameters<typeof getMaxBuilderFee>[1]) {
    return getMaxBuilderFee(this.client, params, this.label);
  }
}

/** Staking HYPE : dépôt/retrait du solde de staking, délégation, lectures. */
class HyperliquidStakingScope extends HyperliquidNativeScope implements IStaking {
  public deposit(params: Parameters<typeof cDeposit>[1]) {
    return cDeposit(this.client, params, this.signed());
  }
  public withdraw(params: Parameters<typeof cWithdraw>[1]) {
    return cWithdraw(this.client, params, this.signed());
  }
  public delegate(params: Parameters<typeof tokenDelegate>[1]) {
    return tokenDelegate(this.client, params, this.signed());
  }
  public delegations() {
    return getDelegations(this.client, { user: this.user() }, this.signed());
  }
  public summary() {
    return getDelegatorSummary(this.client, { user: this.user() }, this.signed());
  }
  public history() {
    return getDelegatorHistory(this.client, { user: this.user() }, this.signed());
  }
  public rewards() {
    return getDelegatorRewards(this.client, { user: this.user() }, this.signed());
  }
}

/** Lectures de compte étendues : par adresse du signer (résolue par le scope). */
class HyperliquidAccountScope extends HyperliquidNativeScope implements IAccountExtra {
  public fees() {
    return getUserFees(this.client, { user: this.user() }, this.signed());
  }
  public portfolio() {
    return getPortfolio(this.client, { user: this.user() }, this.signed());
  }
  public funding(query: { startTime: number; endTime?: number }) {
    return getUserFunding(this.client, { user: this.user(), ...query }, this.signed());
  }
  public ledger(query: { startTime: number; endTime?: number }) {
    return getUserNonFundingLedgerUpdates(
      this.client,
      { user: this.user(), ...query },
      this.signed(),
    );
  }
  public role() {
    return getUserRole(this.client, { user: this.user() }, this.signed());
  }
  public rateLimit() {
    return getUserRateLimit(this.client, { user: this.user() }, this.signed());
  }
  public historicalOrders() {
    return getHistoricalOrders(this.client, { user: this.user() }, this.signed());
  }
}

/** Ordres avancés : batch place/cancel/modify, annulation par client id, query, fills par période. */
class HyperliquidAdvancedOrdersScope extends HyperliquidNativeScope implements IAdvancedOrders {
  public placeBatch(orders: Parameters<typeof placeOrders>[1]) {
    return placeOrders(this.client, orders, this.signed());
  }
  public cancelMany(params: Parameters<typeof cancelOrders>[1]) {
    return cancelOrders(this.client, params, this.signed());
  }
  public cancelManyByClientId(params: Parameters<typeof cancelOrdersByCloid>[1]) {
    return cancelOrdersByCloid(this.client, params, this.signed());
  }
  public modifyBatch(params: Parameters<typeof batchModifyOrders>[1]) {
    return batchModifyOrders(this.client, params, this.signed());
  }
  public query(params: Parameters<typeof getOrderStatus>[1]) {
    return getOrderStatus(this.client, params, this.label);
  }
  public fillsByTime(params: Parameters<typeof getUserFillsByTime>[1]) {
    return getUserFillsByTime(this.client, params, this.label);
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

  /**
   * Surplus **spécifique Hyperliquid** (hors contrat commun), accès uniforme
   * `dex.native.<capacité>(label?)` : `agents`, `transfers`, `marketData`, `advancedOrders`, `account`.
   */
  public get native() {
    const resolve = (label?: string) => this.resolve(label);
    return {
      agents: (label?: string) => new HyperliquidAgentsScope(this.client, resolve(label)),
      transfers: (label?: string) => new HyperliquidTransfersScope(this.client, resolve(label)),
      marketData: (label?: string) => new HyperliquidMarketDataScope(this.client, resolve(label)),
      advancedOrders: (label?: string) =>
        new HyperliquidAdvancedOrdersScope(this.client, resolve(label)),
      /** Lectures de compte étendues (fees, portfolio, funding, ledger, role, rateLimit, historicalOrders). */
      account: (label?: string) => new HyperliquidAccountScope(this.client, resolve(label)),
      /** Sous-comptes : création, transferts (perp/spot), renommage, liste. */
      subAccounts: (label?: string) => new HyperliquidSubAccountsScope(this.client, resolve(label)),
      /** Staking HYPE : dépôt/retrait, délégation, lectures. */
      staking: (label?: string) => new HyperliquidStakingScope(this.client, resolve(label)),
      /** Vaults : dépôt/retrait, création, réglages, distribution, lectures. */
      vaults: (label?: string) => new HyperliquidVaultsScope(this.client, resolve(label)),
      /** TWAP : placement, annulation, fills des slices. */
      twap: (label?: string) => new HyperliquidTwapScope(this.client, resolve(label)),
      /** Parrainage : code, état. */
      referral: (label?: string) => new HyperliquidReferralScope(this.client, resolve(label)),
      /** Builder fee : autorisation, fee max. */
      builderFee: (label?: string) => new HyperliquidBuilderFeeScope(this.client, resolve(label)),
    };
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
