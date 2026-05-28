import { exchangeL1Action } from '../client';

export interface UpdateLeverageParams {
  asset: number;
  /** `true` = cross, `false` = isolé. */
  isCross: boolean;
  leverage: number;
}

/** Construit l'action L1 `updateLeverage`. */
export function buildUpdateLeverageAction(params: UpdateLeverageParams): Record<string, unknown> {
  return {
    type: 'updateLeverage',
    asset: params.asset,
    isCross: params.isCross,
    leverage: params.leverage,
  };
}

/** Met à jour le levier d'un actif (signé, `/exchange`). */
export function updateLeverage<TResponse = unknown>(
  params: UpdateLeverageParams,
  account?: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildUpdateLeverageAction(params), account);
}
