import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `createVault` (le `nonce` est un champ = nonce du POST). */
export function buildCreateVaultAction(
  params: { name: string; description: string; initialUsd: string },
  nonce: number,
): Record<string, unknown> {
  return {
    type: 'createVault',
    name: params.name,
    description: params.description,
    initialUsd: Math.round(Number(params.initialUsd) * 1e6),
    nonce,
  };
}

/** Crée un vault (signé, `/exchange`). `initialUsd` ≥ 100 (chaîne décimale humaine). */
export function createVault<TResponse = unknown>(
  client: HyperliquidClient,
  params: { name: string; description: string; initialUsd: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(
    client,
    (nonce) => buildCreateVaultAction(params, nonce),
    label,
  );
}
