import type { HyperliquidClient } from '../../common/config';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

/** HYPE a 8 décimales : convertit un montant humain (chaîne) en wei entier. */
function toWei(hype: string): number {
  return Math.round(Number(hype) * 1e8);
}

export const TOKEN_DELEGATE_TYPES: Eip712Types = {
  'HyperliquidTransaction:TokenDelegate': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'validator', type: 'address' },
    { name: 'wei', type: 'uint64' },
    { name: 'isUndelegate', type: 'bool' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export function buildTokenDelegateAction(
  params: { validator: `0x${string}`; amount: string; isUndelegate: boolean },
  time: number,
) {
  return {
    type: 'tokenDelegate',
    signatureChainId: '0x66eee' as const,
    validator: params.validator,
    wei: toWei(params.amount),
    isUndelegate: params.isUndelegate,
    nonce: time,
  };
}

/** Délègue (ou retire la délégation de) du HYPE staké à un validateur (user-signed). */
export function tokenDelegate<TResponse = unknown>(
  client: HyperliquidClient,
  params: { validator: `0x${string}`; amount: string; isUndelegate: boolean; time?: number },
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildTokenDelegateAction(params, time),
    types: TOKEN_DELEGATE_TYPES,
    nonce: time,
    label,
  });
}
