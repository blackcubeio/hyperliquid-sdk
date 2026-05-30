import type { HyperliquidClient } from '../../common/config';
import type { UsdClassTransferParams } from '../../common/types';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

export const USD_CLASS_TRANSFER_TYPES: Eip712Types = {
  'HyperliquidTransaction:UsdClassTransfer': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'toPerp', type: 'bool' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export function buildUsdClassTransferAction(params: UsdClassTransferParams, nonce: number) {
  return {
    type: 'usdClassTransfer',
    signatureChainId: '0x66eee' as const,
    amount: params.amount,
    toPerp: params.toPerp,
    nonce,
  };
}

/** Transfert d'USDC entre le wallet perp et le wallet spot (user-signed). */
export function usdClassTransfer<TResponse = unknown>(
  client: HyperliquidClient,
  params: UsdClassTransferParams,
  label: string,
): Promise<TResponse> {
  const nonce = params.nonce ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildUsdClassTransferAction(params, nonce),
    types: USD_CLASS_TRANSFER_TYPES,
    nonce,
    label,
  });
}
