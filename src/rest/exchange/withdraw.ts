import type { WithdrawParams } from '../../common/types';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

export const WITHDRAW_TYPES: Eip712Types = {
  'HyperliquidTransaction:Withdraw': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'time', type: 'uint64' },
  ],
};

export function buildWithdrawAction(params: WithdrawParams, time: number) {
  return {
    type: 'withdraw3',
    signatureChainId: '0x66eee' as const,
    destination: params.address as `0x${string}`,
    amount: params.amount,
    time,
  };
}

/** Retrait d'USDC vers Arbitrum (**user-signed**). `address` = destination. */
export function withdraw<TResponse = unknown>(
  params: WithdrawParams,
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>({
    action: buildWithdrawAction(params, time),
    types: WITHDRAW_TYPES,
    nonce: time,
    label,
  });
}
