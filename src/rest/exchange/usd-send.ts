import type { HyperliquidClient } from '../../common/config';
import type { UsdSendParams } from '../../common/types';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

export const USD_SEND_TYPES: Eip712Types = {
  'HyperliquidTransaction:UsdSend': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'time', type: 'uint64' },
  ],
};

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
  client: HyperliquidClient,
  params: UsdSendParams,
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildUsdSendAction(params, time),
    types: USD_SEND_TYPES,
    nonce: time,
    label,
  });
}
