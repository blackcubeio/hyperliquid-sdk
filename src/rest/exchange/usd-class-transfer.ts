import { userSignedRequest } from '../client';
import type { Eip712Types } from '../types';

export const USD_CLASS_TRANSFER_TYPES: Eip712Types = {
  'HyperliquidTransaction:UsdClassTransfer': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'toPerp', type: 'bool' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export interface UsdClassTransferParams {
  /** Montant USDC en chaîne. */
  amount: string;
  /** `true` = spot → perp, `false` = perp → spot. */
  toPerp: boolean;
  nonce?: number;
}

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
  params: UsdClassTransferParams,
  label: string,
): Promise<TResponse> {
  const nonce = params.nonce ?? Date.now();
  return userSignedRequest<TResponse>({
    action: buildUsdClassTransferAction(params, nonce),
    types: USD_CLASS_TRANSFER_TYPES,
    nonce,
    label,
  });
}
