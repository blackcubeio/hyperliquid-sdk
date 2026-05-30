import type { ModifyParams } from '../../common/types';
import type { OrderParams } from '../../common/types';
import { exchangeL1Action } from '../client';
import { buildOrderWire } from './place-order';

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

/** Modifie plusieurs ordres dans une seule action (signé, `/exchange`). */
export function batchModifyOrders<TResponse = unknown>(
  modifies: ModifyParams[],
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildBatchModifyAction(modifies), label);
}
