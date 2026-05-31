// ── Interfaces COMPLÉMENTAIRES Hyperliquid (hors contrat commun aux DEX) ────────────
// Capacités **spécifiques** à HL, accessibles via le namespace uniforme `dex.native.<capacité>(label?)`
// (convention partagée par les 4 SDK). Noms d'interfaces (`INativeMarket`, `IAdvancedOrders`) et de
// méthodes **identiques** aux autres SDK pour le même geste ; seuls les types de params diffèrent.

import type { approveAgent } from '../rest/exchange/approve-agent';
import type { approveBuilderFee } from '../rest/exchange/approve-builder-fee';
import type { cDeposit } from '../rest/exchange/c-deposit';
import type { cWithdraw } from '../rest/exchange/c-withdraw';
import type { cancelOrdersByCloid } from '../rest/exchange/cancel-by-cloid';
import type { cancelOrders } from '../rest/exchange/cancel-order';
import type { createSubAccount } from '../rest/exchange/create-sub-account';
import type { createVault } from '../rest/exchange/create-vault';
import type { batchModifyOrders } from '../rest/exchange/modify-order';
import type { placeOrders } from '../rest/exchange/place-order';
import type { setReferrer } from '../rest/exchange/set-referrer';
import type { subAccountModify } from '../rest/exchange/sub-account-modify';
import type { subAccountSpotTransfer } from '../rest/exchange/sub-account-spot-transfer';
import type { subAccountTransfer } from '../rest/exchange/sub-account-transfer';
import type { tokenDelegate } from '../rest/exchange/token-delegate';
import type { twapCancel } from '../rest/exchange/twap-cancel';
import type { twapOrder } from '../rest/exchange/twap-order';
import type { vaultDistribute } from '../rest/exchange/vault-distribute';
import type { vaultModify } from '../rest/exchange/vault-modify';
import type { vaultTransfer } from '../rest/exchange/vault-transfer';
import type { getAllMids } from '../rest/info/get-all-mids';
import type { getCandleSnapshot } from '../rest/info/get-candle-snapshot';
import type { getDelegations } from '../rest/info/get-delegations';
import type { getDelegatorHistory } from '../rest/info/get-delegator-history';
import type { getDelegatorRewards } from '../rest/info/get-delegator-rewards';
import type { getDelegatorSummary } from '../rest/info/get-delegator-summary';
import type { getFrontendOpenOrders } from '../rest/info/get-frontend-open-orders';
import type { getHistoricalOrders } from '../rest/info/get-historical-orders';
import type { getMaxBuilderFee } from '../rest/info/get-max-builder-fee';
import type { getMetaAndAssetCtxs } from '../rest/info/get-meta-and-asset-ctxs';
import type { getMetaAndAssetCtxsSpot } from '../rest/info/get-meta-and-asset-ctxs-spot';
import type { getOrderStatus } from '../rest/info/get-order-status';
import type { getPerpDexs } from '../rest/info/get-perp-dexs';
import type { getPortfolio } from '../rest/info/get-portfolio';
import type { getPredictedFundings } from '../rest/info/get-predicted-fundings';
import type { getReferral } from '../rest/info/get-referral';
import type { getSubAccounts } from '../rest/info/get-sub-accounts';
import type { getUserFees } from '../rest/info/get-user-fees';
import type { getUserFillsByTime } from '../rest/info/get-user-fills-by-time';
import type { getUserFunding } from '../rest/info/get-user-funding';
import type { getUserNonFundingLedgerUpdates } from '../rest/info/get-user-non-funding-ledger-updates';
import type { getUserRateLimit } from '../rest/info/get-user-rate-limit';
import type { getUserRole } from '../rest/info/get-user-role';
import type { getUserTwapSliceFills } from '../rest/info/get-user-twap-slice-fills';
import type { getUserVaultEquities } from '../rest/info/get-user-vault-equities';
import type { getVaultDetails } from '../rest/info/get-vault-details';

/** `params` (2ᵉ arg) d'une fonction REST `fn(client, params, label)`. */
type Args<F extends (...a: never[]) => unknown> = Parameters<F>[1];

// ── Types d'ENTRÉE des ÉCRITURES (noms de concept propres, alignés inter-SDK) ──────────────
// Découplés des noms REST internes (le nom public reste stable si l'endpoint change). Les noms
// partagés (`ApproveAgent`, `PlaceBatch`, `CancelMany`) sont **identiques** sur les autres SDK qui
// portent le même geste ; les noms spécifiques HL restent descriptifs (« similaires »). Les lectures
// gardent `Args<typeof fn>` en ligne (un type nommé pour un filtre de lecture n'apporte rien).
// agents (`ApproveAgent` partagé inter-SDK)
export type ApproveAgent = Args<typeof approveAgent>;
// subAccounts (`CreateSubAccount` partagé inter-SDK)
export type CreateSubAccount = Args<typeof createSubAccount>;
export type SubAccountTransfer = Args<typeof subAccountTransfer>;
export type SubAccountSpotTransfer = Args<typeof subAccountSpotTransfer>;
export type SubAccountModify = Args<typeof subAccountModify>;
// staking
export type StakingDeposit = Args<typeof cDeposit>;
export type StakingWithdraw = Args<typeof cWithdraw>;
export type Delegate = Args<typeof tokenDelegate>;
// vaults
export type VaultTransfer = Args<typeof vaultTransfer>;
export type CreateVault = Args<typeof createVault>;
export type VaultModify = Args<typeof vaultModify>;
export type VaultDistribute = Args<typeof vaultDistribute>;
// twap / referral / builderFee
export type TwapOrder = Args<typeof twapOrder>;
export type TwapCancel = Args<typeof twapCancel>;
export type SetReferrer = Args<typeof setReferrer>;
export type ApproveBuilderFee = Args<typeof approveBuilderFee>;
// advancedOrders (`PlaceBatch`/`CancelMany` partagés Aster)
export type PlaceBatch = Args<typeof placeOrders>;
export type CancelMany = Args<typeof cancelOrders>;
export type CancelManyByClientId = Args<typeof cancelOrdersByCloid>;
export type ModifyBatch = Args<typeof batchModifyOrders>;

/** Agents (API wallets) — HL n'expose que l'autorisation. */
export interface IAgents {
  approve(params: ApproveAgent): ReturnType<typeof approveAgent>;
}

/** Sous-comptes HL : création, transferts (perp/spot) master↔sous-compte, renommage, liste. */
export interface ISubAccountsAdmin {
  create(params: CreateSubAccount): ReturnType<typeof createSubAccount>;
  transfer(params: SubAccountTransfer): ReturnType<typeof subAccountTransfer>;
  spotTransfer(params: SubAccountSpotTransfer): ReturnType<typeof subAccountSpotTransfer>;
  modify(params: SubAccountModify): ReturnType<typeof subAccountModify>;
  list(): ReturnType<typeof getSubAccounts>;
}

/** Données de marché supplémentaires HL (lectures **publiques**). */
export interface INativeMarket {
  allMids(dex?: string): ReturnType<typeof getAllMids>;
  candleSnapshot(params: Args<typeof getCandleSnapshot>): ReturnType<typeof getCandleSnapshot>;
  metaAndAssetCtxs(): ReturnType<typeof getMetaAndAssetCtxs>;
  metaAndAssetCtxsSpot(): ReturnType<typeof getMetaAndAssetCtxsSpot>;
  frontendOpenOrders(
    params: Args<typeof getFrontendOpenOrders>,
  ): ReturnType<typeof getFrontendOpenOrders>;
  predictedFundings(): ReturnType<typeof getPredictedFundings>;
  perpDexs(): ReturnType<typeof getPerpDexs>;
}

/** Vaults HL : dépôt/retrait, création, réglages, distribution, lectures. */
export interface IVaults {
  transfer(params: VaultTransfer): ReturnType<typeof vaultTransfer>;
  create(params: CreateVault): ReturnType<typeof createVault>;
  modify(params: VaultModify): ReturnType<typeof vaultModify>;
  distribute(params: VaultDistribute): ReturnType<typeof vaultDistribute>;
  details(params: Args<typeof getVaultDetails>): ReturnType<typeof getVaultDetails>;
  equities(): ReturnType<typeof getUserVaultEquities>;
}

/** TWAP : placement, annulation, fills des slices. */
export interface ITwap {
  place(params: TwapOrder): ReturnType<typeof twapOrder>;
  cancel(params: TwapCancel): ReturnType<typeof twapCancel>;
  sliceFills(): ReturnType<typeof getUserTwapSliceFills>;
}

/** Parrainage : définir son code (une seule fois), lire l'état de parrainage. */
export interface IReferral {
  set(params: SetReferrer): ReturnType<typeof setReferrer>;
  info(): ReturnType<typeof getReferral>;
}

/** Builder fee : autoriser un fee builder, lire le fee max approuvé. */
export interface IBuilderFee {
  approve(params: ApproveBuilderFee): ReturnType<typeof approveBuilderFee>;
  max(params: Args<typeof getMaxBuilderFee>): ReturnType<typeof getMaxBuilderFee>;
}

/** Staking HYPE : dépôt/retrait du solde de staking, délégation à un validateur, lectures. */
export interface IStaking {
  deposit(params: StakingDeposit): ReturnType<typeof cDeposit>;
  withdraw(params: StakingWithdraw): ReturnType<typeof cWithdraw>;
  delegate(params: Delegate): ReturnType<typeof tokenDelegate>;
  delegations(): ReturnType<typeof getDelegations>;
  summary(): ReturnType<typeof getDelegatorSummary>;
  history(): ReturnType<typeof getDelegatorHistory>;
  rewards(): ReturnType<typeof getDelegatorRewards>;
}

/** Lectures de compte étendues HL (par adresse du signer ; `user` injecté par le scope). */
export interface INativeAccount {
  fees(): ReturnType<typeof getUserFees>;
  portfolio(): ReturnType<typeof getPortfolio>;
  funding(query: { startTime: number; endTime?: number }): ReturnType<typeof getUserFunding>;
  ledger(query: {
    startTime: number;
    endTime?: number;
  }): ReturnType<typeof getUserNonFundingLedgerUpdates>;
  role(): ReturnType<typeof getUserRole>;
  rateLimit(): ReturnType<typeof getUserRateLimit>;
  historicalOrders(): ReturnType<typeof getHistoricalOrders>;
}

/** Ordres avancés HL : batch (place/cancel/modify), annulation par client id, query, fills par période. */
export interface IAdvancedOrders {
  placeBatch(orders: PlaceBatch): ReturnType<typeof placeOrders>;
  cancelMany(params: CancelMany): ReturnType<typeof cancelOrders>;
  cancelManyByClientId(params: CancelManyByClientId): ReturnType<typeof cancelOrdersByCloid>;
  modifyBatch(params: ModifyBatch): ReturnType<typeof batchModifyOrders>;
  query(params: Args<typeof getOrderStatus>): ReturnType<typeof getOrderStatus>;
  fillsByTime(params: Args<typeof getUserFillsByTime>): ReturnType<typeof getUserFillsByTime>;
}
