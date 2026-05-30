import type { HyperliquidClient } from '../../common/config';
import type { UpdateIsolatedMarginParams } from '../../common/types';
import { exchangeL1Action } from '../client';

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
  client: HyperliquidClient,
  params: UpdateIsolatedMarginParams,
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildUpdateIsolatedMarginAction(params), label);
}
