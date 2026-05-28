import { userSignedRequest } from '../client';
import type { Eip712Types } from '../types';

export const USD_SEND_TYPES: Eip712Types = {
  'HyperliquidTransaction:UsdSend': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'time', type: 'uint64' },
  ],
};

export interface UsdSendParams {
  destination: `0x${string}`;
  /** Montant USDC en chaîne (ex. "100.5"). */
  amount: string;
  /** Horodatage ms (sert aussi de nonce) ; défaut `Date.now()`. */
  time?: number;
}

export function buildUsdSendAction(params: UsdSendParams, time: number) {
  return {
    type: 'usdSend',
    signatureChainId: '0x66eee' as const,
    destination: params.destination,
    amount: params.amount,
    time,
  };
}

/** Transfert USDC vers un autre compte Hyperliquid (user-signed). */
export function usdSend<TResponse = unknown>(
  params: UsdSendParams,
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>({
    action: buildUsdSendAction(params, time),
    types: USD_SEND_TYPES,
    nonce: time,
    label,
  });
}
