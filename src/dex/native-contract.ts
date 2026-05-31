// ── Interfaces COMPLÉMENTAIRES Hyperliquid (hors contrat commun aux DEX) ────────────
// Capacités **spécifiques** à HL via le namespace `dex.native.<capacité>(label?)`. Le namespace
// native **miroite** le commun : `native.perp()` (surplus perp = reads marché + ordres avancés) et
// `native.account()` (lectures de compte étendues) doublent `perp()`/`account()` ; les capacités sans
// équivalent commun (agents/builders/vaults/staking/subAccounts/referral) restent propres.
// Lectures get-préfixées, écritures = verbes nus, entrées `…Params`.

import type { Candle, Order, Side, SubAccount, UserTrade } from '../common/types';
import type {
  AccountFees,
  AccountRole,
  FundingPayment,
  LedgerUpdate,
  PortfolioWindow,
  RateLimit,
} from '../converters/account';
import type { Ack } from '../converters/ack';
import type { CancelResult } from '../converters/cancel';
import type { ReferralInfo } from '../converters/referral';
import type {
  Delegation,
  StakingDelta,
  StakingReward,
  StakingSummary,
} from '../converters/staking';
import type { TwapPlacement } from '../converters/twap';
import type { VaultDetails, VaultEquity } from '../converters/vault';
import type { EditBatchLeg } from '../rest/edit-batch';
import type { approveAgent } from '../rest/exchange/approve-agent';
import type { approveBuilderFee } from '../rest/exchange/approve-builder-fee';
import type { cDeposit } from '../rest/exchange/c-deposit';
import type { cWithdraw } from '../rest/exchange/c-withdraw';
import type { createSubAccount } from '../rest/exchange/create-sub-account';
import type { createVault } from '../rest/exchange/create-vault';
import type { setReferrer } from '../rest/exchange/set-referrer';
import type { subAccountModify } from '../rest/exchange/sub-account-modify';
import type { tokenDelegate } from '../rest/exchange/token-delegate';
import type { vaultDistribute } from '../rest/exchange/vault-distribute';
import type { vaultModify } from '../rest/exchange/vault-modify';
import type { vaultTransfer } from '../rest/exchange/vault-transfer';
import type { getMetaAndAssetCtxs } from '../rest/info/get-meta-and-asset-ctxs';
import type { getMetaAndAssetCtxsSpot } from '../rest/info/get-meta-and-asset-ctxs-spot';
import type { getPerpDexs } from '../rest/info/get-perp-dexs';
import type { getPredictedFundings } from '../rest/info/get-predicted-fundings';
import type { getVaultDetails } from '../rest/info/get-vault-details';
import type { PlaceOrderParams } from './contract';

/** `params` (2ᵉ arg) d'une fonction REST `fn(client, params, label)`. */
type Args<F extends (...a: never[]) => unknown> = Parameters<F>[1];

// ── Types d'ENTRÉE des ÉCRITURES (noms de concept propres, alignés inter-SDK) ──────────────
// Découplés des noms REST internes (le nom public reste stable si l'endpoint change). Les noms
// partagés (`ApproveAgent`, `PlaceBatch`, `CancelMany`) sont **identiques** sur les autres SDK qui
// portent le même geste ; les noms spécifiques HL restent descriptifs (« similaires »). Les lectures
// gardent `Args<typeof fn>` en ligne (un type nommé pour un filtre de lecture n'apporte rien).
// agents (`ApproveAgentParams` partagé inter-SDK)
export type ApproveAgentParams = Args<typeof approveAgent>;
// subAccounts (`CreateSubAccountParams` partagé inter-SDK)
export type CreateSubAccountParams = Args<typeof createSubAccount>;
export type SubAccountModifyParams = Args<typeof subAccountModify>;
// staking
export type StakingDepositParams = Args<typeof cDeposit>;
export type StakingWithdrawParams = Args<typeof cWithdraw>;
export type DelegateParams = Args<typeof tokenDelegate>;
// vaults
export type VaultTransferParams = Args<typeof vaultTransfer>;
export type CreateVaultParams = Args<typeof createVault>;
export type VaultModifyParams = Args<typeof vaultModify>;
export type VaultDistributeParams = Args<typeof vaultDistribute>;
// referral / builders
export type SetReferrerParams = Args<typeof setReferrer>;
export type ApproveBuilderFeeParams = Args<typeof approveBuilderFee>;
// ── ordres avancés — ENTRÉES en vocabulaire commun (`name`/`side`/`id`/`clientId`) ──
/** Leg d'annulation par `id` (oid) — vocabulaire commun. */
export interface CancelLegParams {
  name: string;
  id: string;
}
/** Leg d'annulation par `clientId` (cloid) — vocabulaire commun. */
export interface CancelByClientIdLegParams {
  name: string;
  clientId: string;
}
/** Leg de modification d'un lot — vocabulaire commun (réutilise {@link EditBatchLeg}). */
export type EditBatchLegParams = EditBatchLeg;
/** Entrée `placeTwap` — vocabulaire commun (`name`/`side`/`size` ; bornes en minutes). */
export interface TwapOrderParams {
  name: string;
  side: Side;
  size: string;
  minutes: number;
  reduceOnly?: boolean;
  randomize?: boolean;
}
/** Entrée `cancelTwap` — vocabulaire commun (`name`/`id` du TWAP). */
export interface TwapCancelParams {
  name: string;
  id: string;
}
/** Entrée — bornes datetime (`YYYY-MM-DD HH:MM:SS` UTC) des lectures de compte historiques. */
export interface AccountHistoryParams {
  startTime: string;
  endTime?: string;
}
/** Prix médian d'un marché (sortie normalisée de `getAllMids`). */
export interface Mid {
  name: string;
  mid: string;
}
/** Entrée `getCandleSnapshot` — vocabulaire commun (`name`, bornes datetime `YYYY-MM-DD HH:MM:SS`). */
export interface CandleSnapshotParams {
  name: string;
  interval: string;
  startTime?: string;
  endTime?: string;
}

/** Agents (API wallets) — HL n'expose que l'autorisation. */
export interface IAgents {
  approve(params: ApproveAgentParams): Promise<Ack>;
}

/**
 * Sous-comptes HL : création, renommage, liste. Les **transferts** master↔sous-compte sont sur le
 * scope commun `transfers()`.
 */
export interface ISubAccountsAdmin {
  create(params: CreateSubAccountParams): Promise<Ack>;
  modify(params: SubAccountModifyParams): Promise<Ack>;
  /** Liste des sous-comptes → `SubAccount[]` (type commun). */
  getList(): Promise<SubAccount[]>;
}

/**
 * Surplus **perp** HL spécifique, accès `dex.native.perp(label?)` (miroir natif de `dex.perp()`) :
 * lectures marché supplémentaires (publiques) **+** ordres avancés. **Même discipline d'I/O que le
 * commun** : entrées en vocabulaire commun (`name`/`side`/`size`/`price`…), sorties via convertisseurs
 * qui **réutilisent les types communs** (`Order`/`UserTrade`) quand le concept existe.
 */
export interface INativePerp {
  // ── lectures marché supplémentaires (publiques ; I/O normalisés) ──
  /** Prix médians par marché → `Mid[]` (`name`/`mid`). */
  getAllMids(dex?: string): Promise<Mid[]>;
  /** Bougies (fenêtre datetime `YYYY-MM-DD HH:MM:SS`) → `Candle[]` (type commun). */
  getCandleSnapshot(params: CandleSnapshotParams): Promise<Candle[]>;
  getMetaAndAssetCtxs(): ReturnType<typeof getMetaAndAssetCtxs>;
  getMetaAndAssetCtxsSpot(): ReturnType<typeof getMetaAndAssetCtxsSpot>;
  /** Ordres ouverts (détaillés) → `Order[]` (type commun). */
  getFrontendOpenOrders(params?: { name?: string }): Promise<Order[]>;
  getPredictedFundings(): ReturnType<typeof getPredictedFundings>;
  getPerpDexs(): ReturnType<typeof getPerpDexs>;
  // ── ordres avancés (signés ; I/O normalisés, types communs) ──
  /** Lot d'ordres — entrée `PlaceOrderParams[]` (vocab commun), sortie `Order[]` (1 par leg). */
  placeBatch(orders: PlaceOrderParams[]): Promise<Order[]>;
  /** Annulation par lot (par `id`/oid, vocab commun) → `CancelResult[]` (1 par leg). */
  cancelMany(cancels: CancelLegParams[]): Promise<CancelResult[]>;
  /** Annulation par lot (par `clientId`/cloid, vocab commun) → `CancelResult[]` (1 par leg). */
  cancelManyByClientId(cancels: CancelByClientIdLegParams[]): Promise<CancelResult[]>;
  /** Modification par lot (vocab commun) → `Order[]` (1 par leg modifié). */
  editBatch(modifies: EditBatchLegParams[]): Promise<Order[]>;
  /** Statut d'un ordre par `id` → `Order` (type commun). */
  getById(params: { name: string; id: string }): Promise<Order>;
  /** Fills du compte (fenêtre datetime `YYYY-MM-DD HH:MM:SS`) → `UserTrade[]` (type commun). */
  getFills(params: { startTime: string; endTime?: string }): Promise<UserTrade[]>;
  /** Place un TWAP (vocab commun) → `TwapPlacement` (`id` du TWAP, `status`). */
  placeTwap(params: TwapOrderParams): Promise<TwapPlacement>;
  /** Annule un TWAP par `id` (vocab commun) → `Ack`. */
  cancelTwap(params: TwapCancelParams): Promise<Ack>;
  /** Fills des slices de TWAP → `UserTrade[]` (type commun, `twapId` dans `xtras`). */
  getTwapFills(): Promise<UserTrade[]>;
}

/** Vaults HL : dépôt/retrait, création, réglages, distribution, lectures. */
export interface IVaults {
  transfer(params: VaultTransferParams): Promise<Ack>;
  create(params: CreateVaultParams): Promise<Ack>;
  modify(params: VaultModifyParams): Promise<Ack>;
  distribute(params: VaultDistributeParams): Promise<Ack>;
  /** Détails d'un vault → `VaultDetails`. */
  getDetails(params: Args<typeof getVaultDetails>): Promise<VaultDetails>;
  /** Équités du compte dans les vaults suivis → `VaultEquity[]`. */
  getEquities(): Promise<VaultEquity[]>;
}

/** Parrainage : définir son code (une seule fois), lire l'état de parrainage. */
export interface IReferral {
  set(params: SetReferrerParams): Promise<Ack>;
  /** État de parrainage → `ReferralInfo`. */
  getInfo(): Promise<ReferralInfo>;
}

/** Builders (fee builders) : autoriser un fee builder, lire le fee max approuvé. */
export interface IBuilders {
  approve(params: ApproveBuilderFeeParams): Promise<Ack>;
  /** Fee max approuvé (dixièmes de bps) → `number`. */
  getMaxFee(params: { user: `0x${string}`; builder: `0x${string}` }): Promise<number>;
}

/** Staking HYPE : dépôt/retrait du solde de staking, délégation à un validateur, lectures. */
export interface IStaking {
  deposit(params: StakingDepositParams): Promise<Ack>;
  withdraw(params: StakingWithdrawParams): Promise<Ack>;
  delegate(params: DelegateParams): Promise<Ack>;
  /** Délégations en cours → `Delegation[]`. */
  getDelegations(): Promise<Delegation[]>;
  /** Résumé de staking → `StakingSummary`. */
  getSummary(): Promise<StakingSummary>;
  /** Historique des opérations → `StakingDelta[]`. */
  getHistory(): Promise<StakingDelta[]>;
  /** Récompenses accumulées → `StakingReward[]`. */
  getRewards(): Promise<StakingReward[]>;
}

/** Lectures de compte étendues HL (par adresse du signer ; `user` injecté par le scope). */
export interface INativeAccount {
  /** Frais du compte → `AccountFees`. */
  getFees(): Promise<AccountFees>;
  /** Portefeuille (séries valeur/PnL par fenêtre) → `PortfolioWindow[]`. */
  getPortfolio(): Promise<PortfolioWindow[]>;
  /** Paiements de funding (fenêtre datetime) → `FundingPayment[]`. */
  getFunding(query: AccountHistoryParams): Promise<FundingPayment[]>;
  /** Mouvements de ledger hors funding (fenêtre datetime) → `LedgerUpdate[]`. */
  getLedger(query: AccountHistoryParams): Promise<LedgerUpdate[]>;
  /** Rôle du compte → `AccountRole`. */
  getRole(): Promise<AccountRole>;
  /** Limites de requêtes → `RateLimit`. */
  getRateLimit(): Promise<RateLimit>;
  /** Ordres historiques → `Order[]` (type commun). */
  getHistoricalOrders(): Promise<Order[]>;
}
