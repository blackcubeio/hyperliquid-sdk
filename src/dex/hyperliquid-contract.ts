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

/** Agents (API wallets) — HL n'expose que l'autorisation. */
export interface IAgents {
  approve(params: Args<typeof approveAgent>): ReturnType<typeof approveAgent>;
}

/** Transferts HL : USDC (perp↔perp), bascule perp↔spot, token spot. */
export interface ITransfers {
  usdSend(params: Args<typeof usdSend>): ReturnType<typeof usdSend>;
  usdClassTransfer(params: Args<typeof usdClassTransfer>): ReturnType<typeof usdClassTransfer>;
  spotSend(params: Args<typeof spotSend>): ReturnType<typeof spotSend>;
}

/** Données de marché supplémentaires HL (lectures **publiques**). */
export interface IMarketDataExtra {
  allMids(dex?: string): ReturnType<typeof getAllMids>;
  candleSnapshot(params: Args<typeof getCandleSnapshot>): ReturnType<typeof getCandleSnapshot>;
  metaAndAssetCtxs(): ReturnType<typeof getMetaAndAssetCtxs>;
  metaAndAssetCtxsSpot(): ReturnType<typeof getMetaAndAssetCtxsSpot>;
  frontendOpenOrders(
    params: Args<typeof getFrontendOpenOrders>,
  ): ReturnType<typeof getFrontendOpenOrders>;
}

/** Ordres avancés HL : batch (place/cancel/modify), annulation par client id, query, fills par période. */
export interface IAdvancedOrders {
  placeBatch(orders: Args<typeof placeOrders>): ReturnType<typeof placeOrders>;
  cancelMany(params: Args<typeof cancelOrders>): ReturnType<typeof cancelOrders>;
  cancelManyByClientId(
    params: Args<typeof cancelOrdersByCloid>,
  ): ReturnType<typeof cancelOrdersByCloid>;
  modifyBatch(params: Args<typeof batchModifyOrders>): ReturnType<typeof batchModifyOrders>;
  query(params: Args<typeof getOrderStatus>): ReturnType<typeof getOrderStatus>;
  fillsByTime(params: Args<typeof getUserFillsByTime>): ReturnType<typeof getUserFillsByTime>;
}
