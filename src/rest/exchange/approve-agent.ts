import { userSignedRequest } from '../client';
import type { Eip712Types } from '../types';

export const APPROVE_AGENT_TYPES: Eip712Types = {
  'HyperliquidTransaction:ApproveAgent': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'agentAddress', type: 'address' },
    { name: 'agentName', type: 'string' },
    { name: 'nonce', type: 'uint64' },
  ],
};

export interface ApproveAgentParams {
  /** Adresse de l'API/agent wallet à autoriser. */
  agentAddress: `0x${string}`;
  /** Nom de l'agent ("" pour un agent non nommé). */
  agentName?: string;
  nonce?: number;
}

export function buildApproveAgentAction(params: ApproveAgentParams, nonce: number) {
  return {
    type: 'approveAgent',
    signatureChainId: '0x66eee' as const,
    agentAddress: params.agentAddress,
    agentName: params.agentName ?? '',
    nonce,
  };
}

/** Autorise une API/agent wallet à signer pour le compte (user-signed). */
export function approveAgent<TResponse = unknown>(
  params: ApproveAgentParams,
  label: string,
): Promise<TResponse> {
  const nonce = params.nonce ?? Date.now();
  return userSignedRequest<TResponse>({
    action: buildApproveAgentAction(params, nonce),
    types: APPROVE_AGENT_TYPES,
    nonce,
    label,
  });
}
