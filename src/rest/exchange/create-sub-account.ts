import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `createSubAccount`. */
export function buildCreateSubAccountAction(name: string): Record<string, unknown> {
  return { type: 'createSubAccount', name };
}

/** Crée un sous-compte (signé, `/exchange`). */
export function createSubAccount<TResponse = unknown>(
  client: HyperliquidClient,
  params: { name: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildCreateSubAccountAction(params.name), label);
}
