import type { HyperliquidClient } from '../../common/config';
import type { SpotSendParams } from '../../common/types';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

export const SPOT_SEND_TYPES: Eip712Types = {
  'HyperliquidTransaction:SpotSend': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'token', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'time', type: 'uint64' },
  ],
};

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
  client: HyperliquidClient,
  params: SpotSendParams,
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildSpotSendAction(params, time),
    types: SPOT_SEND_TYPES,
    nonce: time,
    label,
  });
}
