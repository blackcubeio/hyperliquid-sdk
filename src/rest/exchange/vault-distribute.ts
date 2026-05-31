import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `vaultDistribute` (distribution d'USDC aux déposants). */
export function buildVaultDistributeAction(params: {
  vaultAddress: `0x${string}`;
  usd: string;
}): Record<string, unknown> {
  return {
    type: 'vaultDistribute',
    vaultAddress: params.vaultAddress,
    usd: Math.round(Number(params.usd) * 1e6),
  };
}

/** Distribue de l'USDC aux déposants d'un vault (signé, `/exchange`). */
export function vaultDistribute<TResponse = unknown>(
  client: HyperliquidClient,
  params: { vaultAddress: `0x${string}`; usd: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildVaultDistributeAction(params), label);
}
