// ── Interfaces COMPLÉMENTAIRES Hyperliquid (hors contrat commun aux DEX) ────────────
// Capacités **spécifiques** à HL, accessibles via le namespace uniforme `dex.native.<capacité>(label?)`
// (convention partagée par les 4 SDK). Noms d'interfaces (`IMarketDataExtra`, `IAdvancedOrders`) et de
// méthodes **identiques** aux autres SDK pour le même geste ; seuls les types de params diffèrent.

import type { approveAgent } from '../rest/exchange/approve-agent';
import type { cancelOrdersByCloid } from '../rest/exchange/cancel-by-cloid';
import type { cancelOrders } from '../rest/exchange/cancel-order';
import type { batchModifyOrders } from '../rest/exchange/modify-order';
import type { placeOrders } from '../rest/exchange/place-order';
import type { spotSend } from '../rest/exchange/spot-send';
import type { usdClassTransfer } from '../rest/exchange/usd-class-transfer';
import type { usdSend } from '../rest/exchange/usd-send';
import type { getAllMids } from '../rest/info/get-all-mids';
import type { getCandleSnapshot } from '../rest/info/get-candle-snapshot';
import type { getFrontendOpenOrders } from '../rest/info/get-frontend-open-orders';
import type { getMetaAndAssetCtxs } from '../rest/info/get-meta-and-asset-ctxs';
import type { getMetaAndAssetCtxsSpot } from '../rest/info/get-meta-and-asset-ctxs-spot';
import type { getOrderStatus } from '../rest/info/get-order-status';
import type { getUserFillsByTime } from '../rest/info/get-user-fills-by-time';

/** `params` (2ᵉ arg) d'une fonction REST `fn(client, params, label)`. */
type Args<F extends (...a: never[]) => unknown> = Parameters<F>[1];

// ── Types d'ENTRÉE canoniques (noms alignés inter-SDK ; écritures `…Input`, lectures `…Query`) ──
// Découplés des noms REST internes (le nom public reste stable si l'endpoint change). Les noms
// partagés (`ApproveAgentInput`, `PlaceBatchInput`, `CancelManyInput`) sont **identiques** sur les
// autres SDK qui portent le même geste ; les noms spécifiques HL restent descriptifs (« similaires »).
// agents (nom partagé inter-SDK)
export type ApproveAgentInput = Args<typeof approveAgent>;
// transfers (spécifiques HL)
export type UsdSendInput = Args<typeof usdSend>;
export type UsdClassTransferInput = Args<typeof usdClassTransfer>;
export type SpotSendInput = Args<typeof spotSend>;
// marketData (lectures publiques)
export type CandleSnapshotQuery = Args<typeof getCandleSnapshot>;
export type FrontendOpenOrdersQuery = Args<typeof getFrontendOpenOrders>;
// advancedOrders (`PlaceBatchInput`/`CancelManyInput` partagés Aster)
export type PlaceBatchInput = Args<typeof placeOrders>;
export type CancelManyInput = Args<typeof cancelOrders>;
export type CancelManyByClientIdInput = Args<typeof cancelOrdersByCloid>;
export type ModifyBatchInput = Args<typeof batchModifyOrders>;
export type OrderStatusQuery = Args<typeof getOrderStatus>;
export type FillsByTimeQuery = Args<typeof getUserFillsByTime>;

/** Agents (API wallets) — HL n'expose que l'autorisation. */
export interface IAgents {
  approve(params: ApproveAgentInput): ReturnType<typeof approveAgent>;
}

/** Transferts HL : USDC (perp↔perp), bascule perp↔spot, token spot. */
export interface ITransfers {
  usdSend(params: UsdSendInput): ReturnType<typeof usdSend>;
  usdClassTransfer(params: UsdClassTransferInput): ReturnType<typeof usdClassTransfer>;
  spotSend(params: SpotSendInput): ReturnType<typeof spotSend>;
}

/** Données de marché supplémentaires HL (lectures **publiques**). */
export interface IMarketDataExtra {
  allMids(dex?: string): ReturnType<typeof getAllMids>;
  candleSnapshot(params: CandleSnapshotQuery): ReturnType<typeof getCandleSnapshot>;
  metaAndAssetCtxs(): ReturnType<typeof getMetaAndAssetCtxs>;
  metaAndAssetCtxsSpot(): ReturnType<typeof getMetaAndAssetCtxsSpot>;
  frontendOpenOrders(params: FrontendOpenOrdersQuery): ReturnType<typeof getFrontendOpenOrders>;
}

/** Ordres avancés HL : batch (place/cancel/modify), annulation par client id, query, fills par période. */
export interface IAdvancedOrders {
  placeBatch(orders: PlaceBatchInput): ReturnType<typeof placeOrders>;
  cancelMany(params: CancelManyInput): ReturnType<typeof cancelOrders>;
  cancelManyByClientId(params: CancelManyByClientIdInput): ReturnType<typeof cancelOrdersByCloid>;
  modifyBatch(params: ModifyBatchInput): ReturnType<typeof batchModifyOrders>;
  query(params: OrderStatusQuery): ReturnType<typeof getOrderStatus>;
  fillsByTime(params: FillsByTimeQuery): ReturnType<typeof getUserFillsByTime>;
}
