import type { HyperliquidClient } from '../../common/config';
import type { Eip712Types } from '../../common/types';
import { userSignedRequest } from '../client';

export interface SendAssetParams {
  /** Compte destinataire (0x…). */
  destination: `0x${string}`;
  /** DEX source : `""` = perp (défaut), `"spot"` = spot, sinon nom d'un perp DEX. */
  sourceDex?: string;
  /** DEX destination (mêmes valeurs). */
  destinationDex?: string;
  /** Token transféré (`"NOM:0x…"` pour le spot, `"USDC"`…). */
  token: string;
  /** Montant (chaîne décimale humaine). */
  amount: string;
  /** Sous-compte source (0x… ou `""`). */
  fromSubAccount?: string;
  /** Nonce (défaut : maintenant). */
  time?: number;
}

export const SEND_ASSET_TYPES: Eip712Types = {
  'HyperliquidTransaction:SendAsset': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'destination', type: 'string' },
    { name: 'sourceDex', type: 'string' },
    { name: 'destinationDex', type: 'string' },
    { name: 'token', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'fromSubAccount', type: 'string' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export function buildSendAssetAction(params: SendAssetParams, time: number) {
  return {
    type: 'sendAsset',
    signatureChainId: '0x66eee' as const,
    destination: params.destination,
    sourceDex: params.sourceDex ?? '',
    destinationDex: params.destinationDex ?? '',
    token: params.token,
    amount: params.amount,
    fromSubAccount: params.fromSubAccount ?? '',
    nonce: time,
  };
}

/** Transfert d'actif inter-DEX (perp↔spot↔perp-dex) vers un autre compte (user-signed). */
export function sendAsset<TResponse = unknown>(
  client: HyperliquidClient,
  params: SendAssetParams,
  label: string,
): Promise<TResponse> {
  const time = params.time ?? Date.now();
  return userSignedRequest<TResponse>(client, {
    action: buildSendAssetAction(params, time),
    types: SEND_ASSET_TYPES,
    nonce: time,
    label,
  });
}
