import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `subAccountSpotTransfer` (transfert d'un token spot master↔sous-compte). */
export function buildSubAccountSpotTransferAction(params: {
  subAccountUser: `0x${string}`;
  isDeposit: boolean;
  token: string;
  amount: string;
}): Record<string, unknown> {
  return {
    type: 'subAccountSpotTransfer',
    subAccountUser: params.subAccountUser,
    isDeposit: params.isDeposit,
    token: params.token,
    amount: params.amount,
  };
}

/** Transfert d'un token spot (`"NOM:0x…"`) entre master et sous-compte (signé, `/exchange`). */
export function subAccountSpotTransfer<TResponse = unknown>(
  client: HyperliquidClient,
  params: { subAccountUser: `0x${string}`; isDeposit: boolean; token: string; amount: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildSubAccountSpotTransferAction(params), label);
}
