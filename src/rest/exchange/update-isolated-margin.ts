import { type ExchangeOptions, exchangeL1Action } from '../client';

export interface UpdateIsolatedMarginParams {
  asset: number;
  /** Sens de la position (true = long). */
  isBuy: boolean;
  /** Marge à ajouter (négatif pour retirer), en micro-USD entier (USD × 1e6). */
  ntli: number;
}

/** Construit l'action L1 `updateIsolatedMargin`. */
export function buildUpdateIsolatedMarginAction(
  params: UpdateIsolatedMarginParams,
): Record<string, unknown> {
  return {
    type: 'updateIsolatedMargin',
    asset: params.asset,
    isBuy: params.isBuy,
    ntli: params.ntli,
  };
}

/** Ajuste la marge isolée d'une position (signé, `/exchange`). */
export function updateIsolatedMargin<TResponse = unknown>(
  params: UpdateIsolatedMarginParams,
  options?: ExchangeOptions,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(buildUpdateIsolatedMarginAction(params), options);
}
