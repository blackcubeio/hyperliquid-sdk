import type { HyperliquidClient } from '../../common/config';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

export const APPROVE_BUILDER_FEE_TYPES: Eip712Types = {
  'HyperliquidTransaction:ApproveBuilderFee': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'maxFeeRate', type: 'string' },
    { name: 'builder', type: 'address' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export function buildApproveBuilderFeeAction(
  params: { maxFeeRate: string; builder: `0x${string}` },
  time: number,
) {
  return {
    type: 'approveBuilderFee',
    signatureChainId: '0x66eee' as const,
    maxFeeRate: params.maxFeeRate,
    builder: params.builder,
    nonce: time,
  };
}

/** Autorise un builder à prélever un fee jusqu'à `maxFeeRate` (ex. `"0.001%"`) — user-signed. */
export function approveBuilderFee<TResponse = unknown>(
  client: HyperliquidClient,
  params: { maxFeeRate: string; builder: `0x${string}`; time?: number },
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildApproveBuilderFeeAction(params, time),
    types: APPROVE_BUILDER_FEE_TYPES,
    nonce: time,
    label,
  });
}
