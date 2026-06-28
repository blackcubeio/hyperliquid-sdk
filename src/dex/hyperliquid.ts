import { type HyperliquidClient, type InitOptions, init } from '../common/config';
import type {
  Balance,
  Candle,
  FrontendOrder,
  FundingRate,
  Hex,
  MarketKind,
  Order,
  OrderBook,
  Pair,
  PlaceProtectionParams,
  Position,
  Price,
  ProtectionTp,
  Signer,
  SubAccount,
  Trade,
  UserTrade,
} from '../common/types';
import { assetIndex, dateToMs, formatBoundPrice } from '../common/utils';
import {
  type AccountFees,
  AccountFeesConverter,
  type AccountRole,
  AccountRoleConverter,
  type FundingPayment,
  FundingPaymentConverter,
  HistoricalOrderConverter,
  type HistoricalOrderNative,
  LedgerConverter,
  type LedgerUpdate,
  PortfolioConverter,
  type PortfolioWindow,
  type RateLimit,
  RateLimitConverter,
} from '../converters/account';
import { type Ack, AckConverter, type AckNative } from '../converters/ack';
import { CancelConverter, type CancelResult } from '../converters/cancel';
import { FrontendOrderConverter } from '../converters/frontend-order';
import { ReferralConverter, type ReferralInfo } from '../converters/referral';
import {
  type Delegation,
  DelegationConverter,
  type StakingDelta,
  StakingHistoryConverter,
  type StakingReward,
  StakingRewardConverter,
  type StakingSummary,
  StakingSummaryConverter,
} from '../converters/staking';
import { SubAccountConverter, type SubAccountNative } from '../converters/sub-account';
import {
  TwapFillConverter,
  type TwapPlacement,
  TwapPlacementConverter,
  type TwapSliceFillNative,
} from '../converters/twap';
import { UserTradeConverter } from '../converters/user-trade';
import {
  type VaultDetails,
  VaultDetailsConverter,
  type VaultEquity,
  VaultEquityConverter,
} from '../converters/vault';
import { cancelAllOrders } from '../rest/cancel-all-orders';
import { cancelOrder } from '../rest/cancel-order';
import { editBatchOrders } from '../rest/edit-batch';
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
import { scheduleCancel } from '../rest/exchange/schedule-cancel';
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
import { moveStopOrder } from '../rest/move-stop';
import { type BatchOrderLeg, placeBatchOrders } from '../rest/place-batch';
import { placeOrder } from '../rest/place-order';
import { keyTypeOf, privateKeyToAddress, toChecksumAddress } from '../rest/signing';
import { updateLeverage } from '../rest/update-leverage';
import { UnifiedWsClient } from '../ws/unified-client';
import type {
  CancelAllParams,
  CancelOrderParams,
  CandlesParams,
  EditOrderParams,
  EvmHelper,
  FundingParams,
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
  ITransfers,
  IsolatedMarginParams,
  KeyHelper,
  LeverageParams,
  MarginModeParams,
  MoveStopParams,
  OrderBookParams,
  PlaceOrderParams,
  SymbolParams,
  TransferParams,
  WithdrawParams,
} from './contract';
import type {
  AccountHistoryParams,
  CancelByClientIdLegParams,
  CancelLegParams,
  CandleSnapshotParams,
  EditBatchLegParams,
  IAgents,
  IBuilders,
  INativeAccount,
  INativePerp,
  IReferral,
  IStaking,
  ISubAccountsAdmin,
  IVaults,
  Mid,
  TwapCancelParams,
  TwapOrderParams,
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
  public getCandles(query: CandlesParams): Promise<Candle[]> {
    const startTime =
      query.startTime === undefined
        ? Date.now() - (query.limit ?? 500) * intervalToMs(query.interval)
        : dateToMs(query.startTime);
    return getCandles(
      this.client,
      {
        name: query.name,
        interval: query.interval,
        startTime,
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
        limit: query.limit,
        kind: this.kind,
      },
      this.label,
    );
  }
  public getOrderBook(query: OrderBookParams): Promise<OrderBook> {
    return getOrderBook(
      this.client,
      { name: query.name, limit: query.limit, kind: this.kind },
      this.label,
    );
  }
  public getPrices(): Promise<Price[]> {
    return getPrices(this.client, this.label);
  }
  public getFundingHistory(query: FundingParams): Promise<FundingRate[]> {
    return getFundingHistory(
      this.client,
      {
        name: query.name,
        startTime: query.startTime === undefined ? 0 : dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
      },
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
  public getPositions(query?: SymbolParams): Promise<Position[]> {
    return getPositions(this.client, { user: this.user(), name: query?.name }, this.signed());
  }
  public getOpens(query?: SymbolParams): Promise<Order[]> {
    return getOpenOrders(this.client, { user: this.user(), name: query?.name }, this.signed());
  }
  public getUserTrades(query?: SymbolParams): Promise<UserTrade[]> {
    return getUserTrades(this.client, { user: this.user(), name: query?.name }, this.signed());
  }
  public getAccountInfo(): Promise<unknown> {
    const user = this.user() as Hex;
    return this.spotScope
      ? getClearinghouseStateSpot(this.client, { user }, this.signed())
      : getClearinghouseState(this.client, { user }, this.signed());
  }

  // ── ITrading ──
  public place(input: PlaceOrderParams): Promise<Order> {
    if (input.price !== undefined) {
      return this.submitOrder(input, input.price);
    }
    // Sans `price` : seul un market (plain ou déclenché) peut dériver sa borne du mark ± slippage. Un ordre
    // limite ou déclenché-en-limite exige un `price` explicite.
    const derivable =
      input.type === 'market' || input.type === 'stopMarket' || input.type === 'takeProfitMarket';
    if (derivable === false) {
      throw new Error(
        'place (Hyperliquid) : `price` est requis (ordre limite ou déclenché en limite).',
      );
    }
    // HL n'a pas de market natif : c'est un IOC borné par un prix limite. Sans `price`, on dérive la borne du
    // mark courant ± `slippagePercent` (défaut 1 %), formatée aux règles de prix HL → market uniforme avec les
    // autres DEX (qui acceptent `slippagePercent`), sans exiger de prix de l'appelant.
    return this.marketBoundPrice(input.name, input.side, input.slippagePercent).then((price) =>
      this.submitOrder(input, price),
    );
  }

  // Soumet l'ordre au format unifié avec un prix limite résolu (fourni, ou borne de slippage calculée pour market).
  // `triggerPrice` est transmis tel quel : le REST dérive le wire `trigger` (stop/take-profit) depuis le `type`.
  private submitOrder(input: PlaceOrderParams, price: string): Promise<Order> {
    return placeOrder(
      this.client,
      {
        name: input.name,
        side: input.side,
        type: input.type,
        size: input.size,
        price,
        triggerPrice: input.triggerPrice,
        tif: input.tif,
        reduceOnly: input.reduceOnly,
        clientId: input.clientId as Hex | undefined,
        kind: this.kind,
      },
      this.signed(),
    );
  }

  // Borne de prix d'un ordre market = mark ± slippage, formatée aux règles de prix HL. getPrices (mark) + getPairs
  // (szDecimals) couvrent perp ET spot. Le fill réel se fait au book (IOC) ; la borne ne fait que garantir le fill.
  private marketBoundPrice(
    name: string,
    side: 'buy' | 'sell',
    slippagePercent?: string,
  ): Promise<string> {
    const slip = Number(slippagePercent ?? '1') / 100;
    return Promise.all([this.getPrices(), this.getPairs()]).then(([prices, pairs]) => {
      const mark = Number(prices.find((p) => p.name === name)?.mark);
      if (!Number.isFinite(mark) || mark <= 0) {
        throw new Error(
          `place (Hyperliquid) : mark indisponible pour ${name} (borne de slippage market).`,
        );
      }
      const szDecimals = pairs.find((p) => p.name === name)?.szDecimals ?? 0;
      const raw = side === 'buy' ? mark * (1 + slip) : mark * (1 - slip);
      return formatBoundPrice(raw, szDecimals, this.kind);
    });
  }
  public cancel(input: CancelOrderParams): Promise<void> {
    if (input.id === undefined) {
      throw new Error('cancel (Hyperliquid) : `id` (oid) est requis.');
    }
    return cancelOrder(
      this.client,
      { name: input.name, id: input.id, kind: this.kind },
      this.signed(),
    );
  }
  public cancelAll(input: CancelAllParams): Promise<{ cancelled: number | null }> {
    return cancelAllOrders(
      this.client,
      { user: this.user(), name: input.name, kind: this.kind },
      this.signed(),
    );
  }
  // Protection d'une position : SL plein + N TPs partiels, tous reduce-only, en un lot avec
  // `grouping:positionTpsl` (HL les rattache à la position). `side` = sens de la POSITION → ordres au
  // sens OPPOSÉ. `price` (borne du market déclenché) fourni par l'appelant, sinon le triggerPrice.
  public placeProtection(input: PlaceProtectionParams): Promise<Order[]> {
    const exit: 'buy' | 'sell' = input.side === 'buy' ? 'sell' : 'buy';
    const legs: BatchOrderLeg[] = [
      {
        name: input.name,
        side: exit,
        type: 'stopMarket',
        triggerPrice: input.sl.triggerPrice,
        price: input.sl.price ?? input.sl.triggerPrice,
        size: input.sl.size,
        reduceOnly: true,
      },
      ...input.tps.map(
        (tp: ProtectionTp): BatchOrderLeg => ({
          name: input.name,
          side: exit,
          type: 'takeProfitMarket',
          triggerPrice: tp.triggerPrice,
          price: tp.price ?? tp.triggerPrice,
          size: tp.size,
          reduceOnly: true,
        }),
      ),
    ];
    return placeBatchOrders(this.client, legs, this.signed(), 'positionTpsl');
  }
  // Annule toute la protection de la paire (ordres reduce-only) avant de la re-poser.
  public cancelProtection(input: { name: string }): Promise<void> {
    return this.cancelAll({ name: input.name }).then(() => undefined);
  }
  // Déplace le SL EN PLACE via `modify` (atomique) — la position n'est jamais sans SL, aucun cancel préalable.
  // `side` = sens de la position → le SL est posé au sens OPPOSÉ. Le `modify` reconstruit le wire `trigger`.
  public moveStop(input: MoveStopParams): Promise<{ name: string; id: string }> {
    const exit: 'buy' | 'sell' = input.side === 'buy' ? 'sell' : 'buy';
    return moveStopOrder(
      this.client,
      {
        name: input.name,
        stopId: input.stopId,
        exitIsBuy: exit === 'buy',
        triggerPrice: input.triggerPrice,
        price: input.price ?? input.triggerPrice,
        size: input.size,
        kind: this.kind,
      },
      this.signed(),
    );
  }
  public edit(input: EditOrderParams): Promise<{ name: string; id: string }> {
    if (input.id === undefined) {
      throw new Error('edit (Hyperliquid) : `id` (oid) est requis.');
    }
    if (input.price === undefined) {
      throw new Error('edit (Hyperliquid) : `price` est requis.');
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
  public updateLeverage(input: LeverageParams): Promise<unknown> {
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
  public setMarginMode(input: MarginModeParams): Promise<void> {
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
  public addIsolatedMargin(input: IsolatedMarginParams): Promise<void> {
    return this.adjustIsolatedMargin(input, 1);
  }
  public removeIsolatedMargin(input: IsolatedMarginParams): Promise<void> {
    return this.adjustIsolatedMargin(input, -1);
  }
  private adjustIsolatedMargin(input: IsolatedMarginParams, sign: 1 | -1): Promise<void> {
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
  public withdraw(input: WithdrawParams): Promise<Ack> {
    return withdraw<AckNative>(
      this.client,
      { amount: input.amount, address: input.address },
      this.signed(),
    ).then((r) => ack.toCommon(r));
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
  // Bougies 1m de tout le marché en UNE souscription : on bucketise le flux de prix agrégé (subscribePrices) par
  // symbole. close exact ; OHLC échantillonné ; volume non porté par le flux agrégé → 0. API uniforme sur les DEX.
  public subscribeAllCandles(cb: (c: Candle) => void) {
    const forming = new Map<string, { t: number; o: number; h: number; l: number; c: number }>();
    return this.subscribePrices((prices) => {
      const t = Math.floor(Date.now() / 60_000) * 60_000;
      for (const p of prices) {
        const px = Number(p.mid ?? p.last ?? p.mark ?? p.oracle);
        if (!Number.isFinite(px)) {
          continue;
        }
        let f = forming.get(p.name);
        if (f === undefined || f.t !== t) {
          f = { t, o: px, h: px, l: px, c: px };
          forming.set(p.name, f);
        } else {
          f.h = Math.max(f.h, px);
          f.l = Math.min(f.l, px);
          f.c = px;
        }
        cb({
          t: f.t,
          T: f.t + 60_000,
          s: p.name,
          i: '1m',
          o: String(f.o),
          h: String(f.h),
          l: String(f.l),
          c: String(f.c),
          v: '0',
          n: 0,
          kind: p.kind,
          qv: null,
          tbbv: null,
          tbqv: null,
        });
      }
    });
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

/** Convertisseur d'accusé partagé par les écritures signées sans retour plus riche. */
const ack = new AckConverter();

/** Agents (API wallets). Le dead-man's switch est unifié sous `account().armCancelAll()`. */
class HyperliquidAgentsScope extends HyperliquidNativeScope implements IAgents {
  public approve(params: Parameters<typeof approveAgent>[1]): Promise<Ack> {
    return approveAgent<AckNative>(this.client, params, this.signed()).then((r) => ack.toCommon(r));
  }
}

/**
 * Transferts de fonds **unifiés** (`transfers()` commun). Route le couple `from`/`to` vers l'action
 * native HL : perp↔spot (`usdClassTransfer`), vers un compte (`usdSend`/`spotSend`), master↔sous-compte
 * (`subAccountTransfer`/`subAccountSpotTransfer`). `asset` défaut `USDC` ; un token spot ⇒ `"NOM:0x…"`.
 */
class HyperliquidTransfers extends HyperliquidNativeScope implements ITransfers {
  public transfer(p: TransferParams): Promise<unknown> {
    const from = p.from ?? { wallet: 'perp' as const };
    const asset = p.asset ?? 'USDC';
    const usdc = asset === 'USDC';
    if ('wallet' in from && 'wallet' in p.to) {
      if (from.wallet === p.to.wallet) {
        throw new Error('transfer : `from` et `to` identiques.');
      }
      return usdClassTransfer(
        this.client,
        { amount: p.amount, toPerp: p.to.wallet === 'perp' },
        this.signed(),
      );
    }
    if ('subAccount' in p.to) {
      const sub = p.to.subAccount as `0x${string}`;
      return usdc
        ? subAccountTransfer(
            this.client,
            { subAccountUser: sub, isDeposit: true, usd: p.amount },
            this.signed(),
          )
        : subAccountSpotTransfer(
            this.client,
            {
              subAccountUser: sub,
              isDeposit: true,
              token: asset,
              amount: p.amount,
            },
            this.signed(),
          );
    }
    if ('subAccount' in from) {
      const sub = from.subAccount as `0x${string}`;
      return usdc
        ? subAccountTransfer(
            this.client,
            { subAccountUser: sub, isDeposit: false, usd: p.amount },
            this.signed(),
          )
        : subAccountSpotTransfer(
            this.client,
            {
              subAccountUser: sub,
              isDeposit: false,
              token: asset,
              amount: p.amount,
            },
            this.signed(),
          );
    }
    if ('account' in p.to) {
      const dest = p.to.account as `0x${string}`;
      return usdc
        ? usdSend(this.client, { destination: dest, amount: p.amount }, this.signed())
        : spotSend(
            this.client,
            { destination: dest, token: asset, amount: p.amount },
            this.signed(),
          );
    }
    throw new Error('transfer : combinaison from/to non supportée par Hyperliquid.');
  }
}

/** Sous-comptes : création, transferts (perp/spot) master↔sous-compte, renommage, liste. */
class HyperliquidSubAccountsScope extends HyperliquidNativeScope implements ISubAccountsAdmin {
  public create(params: Parameters<typeof createSubAccount>[1]): Promise<Ack> {
    return createSubAccount<AckNative>(this.client, params, this.signed()).then((r) =>
      ack.toCommon(r),
    );
  }
  public modify(params: Parameters<typeof subAccountModify>[1]): Promise<Ack> {
    return subAccountModify<AckNative>(this.client, params, this.signed()).then((r) =>
      ack.toCommon(r),
    );
  }
  public getList(): Promise<SubAccount[]> {
    return getSubAccounts(this.client, { user: this.user() }, this.signed()).then((res) =>
      new SubAccountConverter().toCommon(res as SubAccountNative[] | null),
    );
  }
}

/**
 * Surplus **perp** HL (miroir natif de `dex.perp()`), accès `dex.native.perp(label?)` :
 * lectures marché supplémentaires (publiques) + ordres avancés (signés). Hors contrat portable.
 */
class HyperliquidNativePerp extends HyperliquidNativeScope implements INativePerp {
  // ── lectures marché supplémentaires (publiques) ──
  public getAllMids(dex?: string): Promise<Mid[]> {
    return getAllMids(this.client, dex, this.label).then((mids) =>
      Object.entries(mids).map(([name, mid]) => ({ name, mid })),
    );
  }
  public getCandleSnapshot(params: CandleSnapshotParams): Promise<Candle[]> {
    return getCandleSnapshot(
      this.client,
      {
        coin: params.name,
        interval: params.interval,
        startTime: params.startTime === undefined ? 0 : dateToMs(params.startTime),
        endTime: params.endTime === undefined ? undefined : dateToMs(params.endTime),
      },
      this.label,
    );
  }
  public getMetaAndAssetCtxs() {
    return getMetaAndAssetCtxs(this.client, this.label);
  }
  public getMetaAndAssetCtxsSpot() {
    return getMetaAndAssetCtxsSpot(this.client, this.label);
  }
  public getFrontendOpenOrders(params?: { name?: string }): Promise<Order[]> {
    const converter = new FrontendOrderConverter();
    return getFrontendOpenOrders(this.client, { user: this.user() as Hex }, this.label).then(
      (orders) => {
        const mapped = orders.map((o) => converter.toCommon(o));
        return params?.name === undefined ? mapped : mapped.filter((o) => o.name === params.name);
      },
    );
  }
  public getPredictedFundings() {
    return getPredictedFundings(this.client, this.label);
  }
  public getPerpDexs() {
    return getPerpDexs(this.client, this.label);
  }
  // ── ordres avancés (signés ; I/O normalisés, types communs) ──
  public placeBatch(orders: PlaceOrderParams[]): Promise<Order[]> {
    return placeBatchOrders(this.client, orders, this.signed());
  }
  public cancelMany(cancels: CancelLegParams[]): Promise<CancelResult[]> {
    return getMeta(this.client, undefined, this.label).then((meta) => {
      const native = cancels.map((c) => ({
        asset: assetIndex(meta.universe, c.name),
        oid: Number(c.id),
      }));
      return cancelOrders<Parameters<CancelConverter['toCommon']>[0]>(
        this.client,
        native,
        this.signed(),
      ).then((res) =>
        new CancelConverter().toCommon(
          res,
          cancels.map((c) => ({ id: c.id, clientId: null })),
        ),
      );
    });
  }
  public cancelManyByClientId(cancels: CancelByClientIdLegParams[]): Promise<CancelResult[]> {
    return getMeta(this.client, undefined, this.label).then((meta) => {
      const native = cancels.map((c) => ({
        asset: assetIndex(meta.universe, c.name),
        cloid: c.clientId as `0x${string}`,
      }));
      return cancelOrdersByCloid<Parameters<CancelConverter['toCommon']>[0]>(
        this.client,
        native,
        this.signed(),
      ).then((res) =>
        new CancelConverter().toCommon(
          res,
          cancels.map((c) => ({ id: null, clientId: c.clientId })),
        ),
      );
    });
  }
  public editBatch(modifies: EditBatchLegParams[]): Promise<Order[]> {
    return editBatchOrders(this.client, modifies, this.signed());
  }
  public getById(params: { name: string; id: string }): Promise<Order> {
    return getOrderStatus(
      this.client,
      { user: this.user() as Hex, oid: Number(params.id) },
      this.label,
    ).then((res) => {
      if (res.order === undefined) {
        throw new Error(`getById (Hyperliquid) : ordre ${params.id} introuvable.`);
      }
      // `orderStatus.order` enveloppe `{ order: FrontendOrder, status, statusTimestamp }`.
      const wrapped = res.order as { order: FrontendOrder; status?: string };
      const order = new FrontendOrderConverter().toCommon(wrapped.order);
      return wrapped.status === undefined
        ? order
        : { ...order, xtras: { ...order.xtras, statusRaw: wrapped.status } };
    });
  }
  public getFills(params: {
    startTime: string;
    endTime?: string;
  }): Promise<UserTrade[]> {
    const converter = new UserTradeConverter();
    return getUserFillsByTime(
      this.client,
      {
        user: this.user() as Hex,
        startTime: dateToMs(params.startTime),
        endTime: params.endTime === undefined ? undefined : dateToMs(params.endTime),
      },
      this.signed(),
    ).then((fills) => fills.map((f) => converter.toCommon(f)));
  }
  public placeTwap(params: TwapOrderParams): Promise<TwapPlacement> {
    return getMeta(this.client, undefined, this.label).then((meta) =>
      twapOrder<Parameters<TwapPlacementConverter['toCommon']>[0]>(
        this.client,
        {
          asset: assetIndex(meta.universe, params.name),
          isBuy: params.side === 'buy',
          size: params.size,
          reduceOnly: params.reduceOnly,
          minutes: params.minutes,
          randomize: params.randomize,
        },
        this.signed(),
      ).then((res) =>
        new TwapPlacementConverter().toCommon(res, {
          name: params.name,
          side: params.side,
          size: params.size,
        }),
      ),
    );
  }
  public cancelTwap(params: TwapCancelParams): Promise<Ack> {
    return getMeta(this.client, undefined, this.label).then((meta) =>
      twapCancel<Parameters<AckConverter['toCommon']>[0]>(
        this.client,
        {
          asset: assetIndex(meta.universe, params.name),
          twapId: Number(params.id),
        },
        this.signed(),
      ).then((res) => new AckConverter().toCommon(res)),
    );
  }
  public getTwapFills(): Promise<UserTrade[]> {
    const converter = new TwapFillConverter();
    return getUserTwapSliceFills(this.client, { user: this.user() as Hex }, this.signed()).then(
      (fills) => ((fills as TwapSliceFillNative[] | null) ?? []).map((f) => converter.toCommon(f)),
    );
  }
}

/** Vaults : dépôt/retrait, création, réglages, distribution, lectures. */
class HyperliquidVaultsScope extends HyperliquidNativeScope implements IVaults {
  public transfer(params: Parameters<typeof vaultTransfer>[1]): Promise<Ack> {
    return vaultTransfer<AckNative>(this.client, params, this.signed()).then((r) =>
      ack.toCommon(r),
    );
  }
  public create(params: Parameters<typeof createVault>[1]): Promise<Ack> {
    return createVault<AckNative>(this.client, params, this.signed()).then((r) => ack.toCommon(r));
  }
  public modify(params: Parameters<typeof vaultModify>[1]): Promise<Ack> {
    return vaultModify<AckNative>(this.client, params, this.signed()).then((r) => ack.toCommon(r));
  }
  public distribute(params: Parameters<typeof vaultDistribute>[1]): Promise<Ack> {
    return vaultDistribute<AckNative>(this.client, params, this.signed()).then((r) =>
      ack.toCommon(r),
    );
  }
  public getDetails(params: Parameters<typeof getVaultDetails>[1]): Promise<VaultDetails> {
    return getVaultDetails(this.client, params, this.label).then((res) =>
      new VaultDetailsConverter().toCommon(res as Parameters<VaultDetailsConverter['toCommon']>[0]),
    );
  }
  public getEquities(): Promise<VaultEquity[]> {
    return getUserVaultEquities(this.client, { user: this.user() }, this.signed()).then((res) =>
      new VaultEquityConverter().toCommon(res as Parameters<VaultEquityConverter['toCommon']>[0]),
    );
  }
}

/** Parrainage : code (une seule fois), lecture de l'état. */
class HyperliquidReferralScope extends HyperliquidNativeScope implements IReferral {
  public set(params: Parameters<typeof setReferrer>[1]): Promise<Ack> {
    return setReferrer<AckNative>(this.client, params, this.signed()).then((r) => ack.toCommon(r));
  }
  public getInfo(): Promise<ReferralInfo> {
    return getReferral(this.client, { user: this.user() }, this.signed()).then((res) =>
      new ReferralConverter().toCommon(res as Parameters<ReferralConverter['toCommon']>[0]),
    );
  }
}

/** Builders (fee builders) : autorisation, lecture du fee max approuvé. */
class HyperliquidBuildersScope extends HyperliquidNativeScope implements IBuilders {
  public approve(params: Parameters<typeof approveBuilderFee>[1]): Promise<Ack> {
    return approveBuilderFee<AckNative>(this.client, params, this.signed()).then((r) =>
      ack.toCommon(r),
    );
  }
  public getMaxFee(params: {
    user: `0x${string}`;
    builder: `0x${string}`;
  }): Promise<number> {
    return getMaxBuilderFee(this.client, params, this.label).then((res) => Number(res));
  }
}

/** Staking HYPE : dépôt/retrait du solde de staking, délégation, lectures. */
class HyperliquidStakingScope extends HyperliquidNativeScope implements IStaking {
  public deposit(params: Parameters<typeof cDeposit>[1]): Promise<Ack> {
    return cDeposit<AckNative>(this.client, params, this.signed()).then((r) => ack.toCommon(r));
  }
  public withdraw(params: Parameters<typeof cWithdraw>[1]): Promise<Ack> {
    return cWithdraw<AckNative>(this.client, params, this.signed()).then((r) => ack.toCommon(r));
  }
  public delegate(params: Parameters<typeof tokenDelegate>[1]): Promise<Ack> {
    return tokenDelegate<AckNative>(this.client, params, this.signed()).then((r) =>
      ack.toCommon(r),
    );
  }
  public getDelegations(): Promise<Delegation[]> {
    return getDelegations(this.client, { user: this.user() }, this.signed()).then((res) =>
      new DelegationConverter().toCommon(res as Parameters<DelegationConverter['toCommon']>[0]),
    );
  }
  public getSummary(): Promise<StakingSummary> {
    return getDelegatorSummary(this.client, { user: this.user() }, this.signed()).then((res) =>
      new StakingSummaryConverter().toCommon(
        res as Parameters<StakingSummaryConverter['toCommon']>[0],
      ),
    );
  }
  public getHistory(): Promise<StakingDelta[]> {
    return getDelegatorHistory(this.client, { user: this.user() }, this.signed()).then((res) =>
      new StakingHistoryConverter().toCommon(
        res as Parameters<StakingHistoryConverter['toCommon']>[0],
      ),
    );
  }
  public getRewards(): Promise<StakingReward[]> {
    return getDelegatorRewards(this.client, { user: this.user() }, this.signed()).then((res) =>
      new StakingRewardConverter().toCommon(
        res as Parameters<StakingRewardConverter['toCommon']>[0],
      ),
    );
  }
}

/** Lectures de compte étendues : par adresse du signer (résolue par le scope). */
class HyperliquidAccountScope extends HyperliquidNativeScope implements INativeAccount {
  public getFees(): Promise<AccountFees> {
    return getUserFees(this.client, { user: this.user() }, this.signed()).then((res) =>
      new AccountFeesConverter().toCommon(res as Parameters<AccountFeesConverter['toCommon']>[0]),
    );
  }
  public getPortfolio(): Promise<PortfolioWindow[]> {
    return getPortfolio(this.client, { user: this.user() }, this.signed()).then((res) =>
      new PortfolioConverter().toCommon(res as Parameters<PortfolioConverter['toCommon']>[0]),
    );
  }
  public getFunding(query: AccountHistoryParams): Promise<FundingPayment[]> {
    return getUserFunding(
      this.client,
      {
        user: this.user(),
        startTime: dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
      },
      this.signed(),
    ).then((res) =>
      new FundingPaymentConverter().toCommon(
        res as Parameters<FundingPaymentConverter['toCommon']>[0],
      ),
    );
  }
  public getLedger(query: AccountHistoryParams): Promise<LedgerUpdate[]> {
    return getUserNonFundingLedgerUpdates(
      this.client,
      {
        user: this.user(),
        startTime: dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
      },
      this.signed(),
    ).then((res) =>
      new LedgerConverter().toCommon(res as Parameters<LedgerConverter['toCommon']>[0]),
    );
  }
  public getRole(): Promise<AccountRole> {
    return getUserRole(this.client, { user: this.user() }, this.signed()).then((res) =>
      new AccountRoleConverter().toCommon(res as Parameters<AccountRoleConverter['toCommon']>[0]),
    );
  }
  public getRateLimit(): Promise<RateLimit> {
    return getUserRateLimit(this.client, { user: this.user() }, this.signed()).then((res) =>
      new RateLimitConverter().toCommon(res as Parameters<RateLimitConverter['toCommon']>[0]),
    );
  }
  public getHistoricalOrders(): Promise<Order[]> {
    const converter = new HistoricalOrderConverter();
    return getHistoricalOrders(this.client, { user: this.user() }, this.signed()).then((res) =>
      ((res as HistoricalOrderNative[] | null) ?? []).map((o) => converter.toCommon(o)),
    );
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

  /** Scope **transferts** unifié (compte/sous-compte/wallet perp↔spot). */
  public transfers(label?: string): HyperliquidTransfers {
    return new HyperliquidTransfers(this.client, this.resolve(label));
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
   * Surplus **spécifique Hyperliquid** (hors contrat commun). Le namespace `native` **miroite** le
   * commun : `dex.native.perp()` (reads marché + ordres avancés, miroir de `perp()`),
   * `dex.native.account()` (lectures de compte étendues, miroir de `account()`) ; + capacités propres
   * `agents`, `subAccounts`, `staking`, `vaults`, `referral`, `builders`.
   */
  public get native() {
    const resolve = (label?: string) => this.resolve(label);
    return {
      agents: (label?: string) => new HyperliquidAgentsScope(this.client, resolve(label)),
      /** Surplus **perp** (miroir natif de perp()) : reads marché + ordres avancés (batch/twap/…). */
      perp: (label?: string) => new HyperliquidNativePerp(this.client, resolve(label)),
      /** Lectures de compte étendues (fees, portfolio, funding, ledger, role, rateLimit, historicalOrders). */
      account: (label?: string) => new HyperliquidAccountScope(this.client, resolve(label)),
      /** Sous-comptes : création, transferts (perp/spot), renommage, liste. */
      subAccounts: (label?: string) => new HyperliquidSubAccountsScope(this.client, resolve(label)),
      /** Staking HYPE : dépôt/retrait, délégation, lectures. */
      staking: (label?: string) => new HyperliquidStakingScope(this.client, resolve(label)),
      /** Vaults : dépôt/retrait, création, réglages, distribution, lectures. */
      vaults: (label?: string) => new HyperliquidVaultsScope(this.client, resolve(label)),
      /** Parrainage : code, état. */
      referral: (label?: string) => new HyperliquidReferralScope(this.client, resolve(label)),
      /** Builders (fee builders) : autorisation, fee max. */
      builders: (label?: string) => new HyperliquidBuildersScope(this.client, resolve(label)),
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
