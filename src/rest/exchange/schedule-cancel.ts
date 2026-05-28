import { exchangeL1Action } from '../client';

export interface ScheduleCancelParams {
  /** Horodatage (ms) de l'annulation programmée (dead-man's switch). Omis/null = désactive. */
  time?: number | null;
}

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
  params: ScheduleCancelParams = {},
  account?: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildScheduleCancelAction(params), account);
}
