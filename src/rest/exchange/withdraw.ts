import { userSignedRequest } from '../client';
import type { Eip712Types } from '../types';

export const WITHDRAW_TYPES: Eip712Types = {
  'HyperliquidTransaction:Withdraw': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'time', type: 'uint64' },
  ],
};

export interface WithdrawParams {
  destination: `0x${string}`;
  /** Montant USDC en chaîne. */
  amount: string;
  time?: number;
}

export function buildWithdrawAction(params: WithdrawParams, time: number) {
  return {
    type: 'withdraw3',
    signatureChainId: '0x66eee' as const,
    destination: params.destination,
    amount: params.amount,
    time,
  };
}

/** Retrait d'USDC vers Arbitrum (user-signed). */
export function withdraw<TResponse = unknown>(params: WithdrawParams): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>({
    action: buildWithdrawAction(params, time),
    types: WITHDRAW_TYPES,
    nonce: time,
  });
}
