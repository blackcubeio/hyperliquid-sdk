import type { HyperliquidClient } from '../../common/config';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

/** HYPE a 8 décimales : convertit un montant humain (chaîne) en wei entier. */
function toWei(hype: string): number {
  return Math.round(Number(hype) * 1e8);
}

export const C_DEPOSIT_TYPES: Eip712Types = {
  'HyperliquidTransaction:CDeposit': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'wei', type: 'uint64' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export function buildCDepositAction(amount: string, time: number) {
  return {
    type: 'cDeposit',
    signatureChainId: '0x66eee' as const,
    wei: toWei(amount),
    nonce: time,
  };
}

/** Dépôt de HYPE vers le staking (user-signed). `amount` en HYPE (chaîne humaine). */
export function cDeposit<TResponse = unknown>(
  client: HyperliquidClient,
  params: { amount: string; time?: number },
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildCDepositAction(params.amount, time),
    types: C_DEPOSIT_TYPES,
    nonce: time,
    label,
  });
}
