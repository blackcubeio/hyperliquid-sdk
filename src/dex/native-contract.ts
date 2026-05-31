// ── Interfaces COMPLÉMENTAIRES Hyperliquid (hors contrat commun aux DEX) ────────────
// Capacités **spécifiques** à HL via le namespace `dex.native.<capacité>(label?)`. Le namespace
// native **miroite** le commun : `native.perp()` (surplus perp = reads marché + ordres avancés) et
// `native.account()` (lectures de compte étendues) doublent `perp()`/`account()` ; les capacités sans
// équivalent commun (agents/builders/vaults/staking/subAccounts/referral) restent propres.
// Lectures get-préfixées, écritures = verbes nus, entrées `…Params`.

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
// twap / referral / builders
export type TwapOrderParams = Args<typeof twapOrder>;
export type TwapCancelParams = Args<typeof twapCancel>;
export type SetReferrerParams = Args<typeof setReferrer>;
export type ApproveBuilderFeeParams = Args<typeof approveBuilderFee>;
// orders (`PlaceBatchParams`/`CancelManyParams` partagés Aster)
export type PlaceBatchParams = Args<typeof placeOrders>;
export type CancelManyParams = Args<typeof cancelOrders>;
export type CancelManyByClientIdParams = Args<typeof cancelOrdersByCloid>;
export type EditBatchParams = Args<typeof batchModifyOrders>;
/** Entrée — bornes datetime (`YYYY-MM-DD HH:MM:SS` UTC) des lectures de compte historiques. */
export interface AccountHistoryParams {
  startTime: string;
  endTime?: string;
}

/** Agents (API wallets) — HL n'expose que l'autorisation. */
export interface IAgents {
  approve(params: ApproveAgentParams): ReturnType<typeof approveAgent>;
}

/**
 * Sous-comptes HL : création, renommage, liste. Les **transferts** master↔sous-compte sont sur le
 * scope commun `transfers()`.
 */
export interface ISubAccountsAdmin {
  create(params: CreateSubAccountParams): ReturnType<typeof createSubAccount>;
  modify(params: SubAccountModifyParams): ReturnType<typeof subAccountModify>;
  getList(): ReturnType<typeof getSubAccounts>;
}

/**
 * Surplus **perp** HL spécifique, accès `dex.native.perp(label?)` (miroir natif de `dex.perp()`) :
 * lectures marché supplémentaires (get-préfixées, publiques) **+** ordres avancés (batch/cloid/edit/
 * lecture/fills/TWAP). Hors contrat portable — formes natives assumées (shapes par index d'actif).
 */
export interface INativePerp {
  // ── lectures marché supplémentaires (publiques) ──
  getAllMids(dex?: string): ReturnType<typeof getAllMids>;
  getCandleSnapshot(params: Args<typeof getCandleSnapshot>): ReturnType<typeof getCandleSnapshot>;
  getMetaAndAssetCtxs(): ReturnType<typeof getMetaAndAssetCtxs>;
  getMetaAndAssetCtxsSpot(): ReturnType<typeof getMetaAndAssetCtxsSpot>;
  getFrontendOpenOrders(
    params: Args<typeof getFrontendOpenOrders>,
  ): ReturnType<typeof getFrontendOpenOrders>;
  getPredictedFundings(): ReturnType<typeof getPredictedFundings>;
  getPerpDexs(): ReturnType<typeof getPerpDexs>;
  // ── ordres avancés (signés ; formes natives par index d'actif) ──
  placeBatch(orders: PlaceBatchParams): ReturnType<typeof placeOrders>;
  cancelMany(params: CancelManyParams): ReturnType<typeof cancelOrders>;
  cancelManyByClientId(params: CancelManyByClientIdParams): ReturnType<typeof cancelOrdersByCloid>;
  editBatch(params: EditBatchParams): ReturnType<typeof batchModifyOrders>;
  getById(params: Args<typeof getOrderStatus>): ReturnType<typeof getOrderStatus>;
  getFills(params: Args<typeof getUserFillsByTime>): ReturnType<typeof getUserFillsByTime>;
  placeTwap(params: TwapOrderParams): ReturnType<typeof twapOrder>;
  cancelTwap(params: TwapCancelParams): ReturnType<typeof twapCancel>;
  getTwapFills(): ReturnType<typeof getUserTwapSliceFills>;
}

/** Vaults HL : dépôt/retrait, création, réglages, distribution, lectures. */
export interface IVaults {
  transfer(params: VaultTransferParams): ReturnType<typeof vaultTransfer>;
  create(params: CreateVaultParams): ReturnType<typeof createVault>;
  modify(params: VaultModifyParams): ReturnType<typeof vaultModify>;
  distribute(params: VaultDistributeParams): ReturnType<typeof vaultDistribute>;
  getDetails(params: Args<typeof getVaultDetails>): ReturnType<typeof getVaultDetails>;
  getEquities(): ReturnType<typeof getUserVaultEquities>;
}

/** Parrainage : définir son code (une seule fois), lire l'état de parrainage. */
export interface IReferral {
  set(params: SetReferrerParams): ReturnType<typeof setReferrer>;
  getInfo(): ReturnType<typeof getReferral>;
}

/** Builders (fee builders) : autoriser un fee builder, lire le fee max approuvé. */
export interface IBuilders {
  approve(params: ApproveBuilderFeeParams): ReturnType<typeof approveBuilderFee>;
  getMaxFee(params: Args<typeof getMaxBuilderFee>): ReturnType<typeof getMaxBuilderFee>;
}

/** Staking HYPE : dépôt/retrait du solde de staking, délégation à un validateur, lectures. */
export interface IStaking {
  deposit(params: StakingDepositParams): ReturnType<typeof cDeposit>;
  withdraw(params: StakingWithdrawParams): ReturnType<typeof cWithdraw>;
  delegate(params: DelegateParams): ReturnType<typeof tokenDelegate>;
  getDelegations(): ReturnType<typeof getDelegations>;
  getSummary(): ReturnType<typeof getDelegatorSummary>;
  getHistory(): ReturnType<typeof getDelegatorHistory>;
  getRewards(): ReturnType<typeof getDelegatorRewards>;
}

/** Lectures de compte étendues HL (par adresse du signer ; `user` injecté par le scope). */
export interface INativeAccount {
  getFees(): ReturnType<typeof getUserFees>;
  getPortfolio(): ReturnType<typeof getPortfolio>;
  getFunding(query: AccountHistoryParams): ReturnType<typeof getUserFunding>;
  getLedger(query: AccountHistoryParams): ReturnType<typeof getUserNonFundingLedgerUpdates>;
  getRole(): ReturnType<typeof getUserRole>;
  getRateLimit(): ReturnType<typeof getUserRateLimit>;
  getHistoricalOrders(): ReturnType<typeof getHistoricalOrders>;
}
