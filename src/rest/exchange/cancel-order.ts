import type { CancelParams } from '../../common/types';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `cancel`. Exporté pour test/inspection sans envoi réseau. */
export function buildCancelAction(cancels: CancelParams[]): Record<string, unknown> {
  return {
    type: 'cancel',
    cancels: cancels.map((cancel) => ({ a: cancel.asset, o: cancel.oid })),
  };
}

/** Annule plusieurs ordres par `oid` dans une seule action (signé, `/exchange`). */
export function cancelOrders<TResponse = unknown>(
  cancels: CancelParams[],
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildCancelAction(cancels), label);
}
