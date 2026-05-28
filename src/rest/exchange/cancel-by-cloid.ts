import { exchangeL1Action } from '../client';

export interface CancelByCloidParams {
  asset: number;
  /** Client order ID (bytes16 hex). */
  cloid: `0x${string}`;
}

/** Construit l'action L1 `cancelByCloid` (clés `asset`/`cloid`, non abrégées). */
export function buildCancelByCloidAction(cancels: CancelByCloidParams[]): Record<string, unknown> {
  return {
    type: 'cancelByCloid',
    cancels: cancels.map((cancel) => ({ asset: cancel.asset, cloid: cancel.cloid })),
  };
}

/** Annule un ou plusieurs ordres par client order ID (signé, `/exchange`). */
export function cancelOrdersByCloid<TResponse = unknown>(
  cancels: CancelByCloidParams[],
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildCancelByCloidAction(cancels), label);
}
