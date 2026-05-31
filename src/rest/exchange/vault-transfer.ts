import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Convertit un montant USDC humain (chaîne décimale) en micro-USD entier attendu par HL. */
function toMicroUsd(usd: string): number {
  return Math.round(Number(usd) * 1e6);
}

/** Construit l'action L1 `vaultTransfer` (dépôt/retrait sur un vault). */
export function buildVaultTransferAction(params: {
  vaultAddress: `0x${string}`;
  isDeposit: boolean;
  usd: string;
}): Record<string, unknown> {
  return {
    type: 'vaultTransfer',
    vaultAddress: params.vaultAddress,
    isDeposit: params.isDeposit,
    usd: toMicroUsd(params.usd),
  };
}

/** Dépôt (ou retrait) d'USDC sur un vault (signé, `/exchange`). */
export function vaultTransfer<TResponse = unknown>(
  client: HyperliquidClient,
  params: { vaultAddress: `0x${string}`; isDeposit: boolean; usd: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildVaultTransferAction(params), label);
}
