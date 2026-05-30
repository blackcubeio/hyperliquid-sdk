import type { ScheduleCancelParams } from '../../common/types';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `scheduleCancel`. */
export function buildScheduleCancelAction(
  params: ScheduleCancelParams = {},
): Record<string, unknown> {
  const action: Record<string, unknown> = { type: 'scheduleCancel' };
  if (params.time !== undefined) {
    action.time = params.time;
  }
  return action;
}

/** Programme (ou désactive) l'annulation automatique de tous les ordres (signé, `/exchange`). */
export function scheduleCancel<TResponse = unknown>(
  params: ScheduleCancelParams,
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildScheduleCancelAction(params), label);
}
