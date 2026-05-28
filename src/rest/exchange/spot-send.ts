import { userSignedRequest } from '../client';
import type { Eip712Types } from '../types';

export const SPOT_SEND_TYPES: Eip712Types = {
  'HyperliquidTransaction:SpotSend': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'token', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'time', type: 'uint64' },
  ],
};

export interface SpotSendParams {
  destination: `0x${string}`;
  /** Identifiant du token au format `name:tokenId` (ex. "USDC:0x…"). */
  token: string;
  amount: string;
  time?: number;
}

export function buildSpotSendAction(params: SpotSendParams, time: number) {
  return {
    type: 'spotSend',
    signatureChainId: '0x66eee' as const,
    destination: params.destination,
    token: params.token,
    amount: params.amount,
    time,
  };
}

/** Transfert d'un token spot vers un autre compte (user-signed). */
export function spotSend<TResponse = unknown>(
  params: SpotSendParams,
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>({
    action: buildSpotSendAction(params, time),
    types: SPOT_SEND_TYPES,
    nonce: time,
    label,
  });
}
