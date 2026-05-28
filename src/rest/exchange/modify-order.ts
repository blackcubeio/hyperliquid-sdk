import { exchangeL1Action } from '../client';
import { type OrderParams, buildOrderWire } from './place-order';

export interface ModifyParams {
  /** Order ID de l'ordre à modifier. */
  oid: number;
  /** Nouvel ordre (remplace l'ancien). */
  order: OrderParams;
}

/** Construit l'action L1 `modify`. */
export function buildModifyAction(params: ModifyParams): Record<string, unknown> {
  return {
    type: 'modify',
    oid: params.oid,
    order: buildOrderWire(params.order),
  };
}

/** Construit l'action L1 `batchModify`. */
export function buildBatchModifyAction(modifies: ModifyParams[]): Record<string, unknown> {
  return {
    type: 'batchModify',
    modifies: modifies.map((modify) => ({ oid: modify.oid, order: buildOrderWire(modify.order) })),
  };
}

/** Modifie un ordre existant (signé, `/exchange`). */
export function editOrder<TResponse = unknown>(
  params: ModifyParams,
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildModifyAction(params), label);
}

/** Modifie plusieurs ordres dans une seule action (signé, `/exchange`). */
export function batchModifyOrders<TResponse = unknown>(
  modifies: ModifyParams[],
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildBatchModifyAction(modifies), label);
}
