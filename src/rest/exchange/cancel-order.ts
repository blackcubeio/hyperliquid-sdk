import { type ExchangeOptions, exchangeL1Action } from '../client';

export interface CancelParams {
  /** Asset ID entier. */
  asset: number;
  /** Order ID (oid). */
  oid: number;
}

/** Construit l'action L1 `cancel`. Exporté pour test/inspection sans envoi réseau. */
export function buildCancelAction(cancels: CancelParams[]): Record<string, unknown> {
  return {
    type: 'cancel',
    cancels: cancels.map((cancel) => ({ a: cancel.asset, o: cancel.oid })),
  };
}

/** Annule un ou plusieurs ordres par `oid` (signé, `/exchange`). */
export function cancelOrders<TResponse = unknown>(
  cancels: CancelParams[],
  options?: ExchangeOptions,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildCancelAction(cancels), options);
}
