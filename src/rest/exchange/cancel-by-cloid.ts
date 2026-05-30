import type { HyperliquidClient } from '../../common/config';
import type { CancelByCloidParams } from '../../common/types';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `cancelByCloid` (clés `asset`/`cloid`, non abrégées). */
export function buildCancelByCloidAction(cancels: CancelByCloidParams[]): Record<string, unknown> {
  return {
    type: 'cancelByCloid',
    cancels: cancels.map((cancel) => ({ asset: cancel.asset, cloid: cancel.cloid })),
  };
}

/** Annule un ou plusieurs ordres par client order ID (signé, `/exchange`). */
export function cancelOrdersByCloid<TResponse = unknown>(
  client: HyperliquidClient,
  cancels: CancelByCloidParams[],
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildCancelByCloidAction(cancels), label);
}
