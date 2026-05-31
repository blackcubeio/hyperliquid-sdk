import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Convertit un montant USDC humain (chaîne décimale) en micro-USD entier attendu par HL. */
function toMicroUsd(usd: string): number {
  return Math.round(Number(usd) * 1e6);
}

/** Construit l'action L1 `subAccountTransfer` (transfert USDC perp master↔sous-compte). */
export function buildSubAccountTransferAction(params: {
  subAccountUser: `0x${string}`;
  isDeposit: boolean;
  usd: string;
}): Record<string, unknown> {
  return {
    type: 'subAccountTransfer',
    subAccountUser: params.subAccountUser,
    isDeposit: params.isDeposit,
    usd: toMicroUsd(params.usd),
  };
}

/** Transfert d'USDC (perp) entre le compte master et un sous-compte (signé, `/exchange`). */
export function subAccountTransfer<TResponse = unknown>(
  client: HyperliquidClient,
  params: { subAccountUser: `0x${string}`; isDeposit: boolean; usd: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildSubAccountTransferAction(params), label);
}
