import type { HyperliquidClient } from '../common/config';
import { EXCHANGE_PATH, INFO_PATH } from '../common/constants';
import type { ResolvedSigner } from '../common/types';
import type { JsonValue, Network } from '../common/types';
import type { Eip712Types } from '../common/types';
import { signL1Action, signUserSignedAction } from './signing';

export class HyperliquidApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HyperliquidApiError';
  }
}

/**
 * Résout le signer d'une **écriture** par son label. Le signer est **obligatoire** : on lève
 * si le label est absent ou inconnu.
 */
export function resolveSigner(client: HyperliquidClient, label?: string): ResolvedSigner {
  if (label === undefined) {
    throw new Error('Un signer (label) est obligatoire pour cette action signée');
  }
  const signer = client.signers[label];
  if (signer === undefined) {
    throw new Error(`Aucun signer enregistré sous "${label}"; ajoute-le dans init({ signers })`);
  }
  return {
    label,
    account: signer.publicKey,
    privateKey: signer.privateKey,
    network: signer.network,
    vaultAddress: signer.vaultAddress,
  };
}

/**
 * Réseau d'une **lecture**. Le signer est optionnel : avec un label on tape sur son réseau,
 * sinon on retombe sur le **mainnet** (les lectures ne touchent pas au wallet).
 */
export function resolveReadNetwork(client: HyperliquidClient, label?: string): Network {
  if (label === undefined) {
    return 'mainnet';
  }
  const signer = client.signers[label];
  if (signer === undefined) {
    throw new Error(`Aucun signer enregistré sous "${label}"; ajoute-le dans init({ signers })`);
  }
  return signer.network;
}

/** Lecture (non signée) via `POST /info`. `label` optionnel choisit le réseau (défaut mainnet). */
export function infoRequest<TResponse>(
  client: HyperliquidClient,
  body: Record<string, JsonValue>,
  label?: string,
): Promise<TResponse> {
  const url = client.restUrls[resolveReadNetwork(client, label)] + INFO_PATH;
  return client
    .fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    .then((response) => parseJson<TResponse>(response));
}

/** POST brut vers `/exchange` sur le réseau donné (body déjà construit et signé). */
export function postExchange<TResponse>(
  client: HyperliquidClient,
  body: Record<string, unknown>,
  network: Network,
): Promise<TResponse> {
  return client
    .fetch(client.restUrls[network] + EXCHANGE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    .then((response) => parseExchange<TResponse>(response));
}

/** Signe une action L1 avec le signer `label` (obligatoire) puis la poste sur son réseau. */
export function exchangeL1Action<TResponse>(
  client: HyperliquidClient,
  action: Record<string, unknown>,
  label: string,
): Promise<TResponse> {
  const signer = resolveSigner(client, label);
  const nonce = Date.now();
  const signature = signL1Action({
    privateKey: signer.privateKey,
    action,
    nonce,
    isTestnet: signer.network === 'testnet',
    vaultAddress: signer.vaultAddress,
  });
  const body: Record<string, unknown> = { action, nonce, signature };
  if (signer.vaultAddress !== undefined) {
    body.vaultAddress = signer.vaultAddress;
  }
  return postExchange<TResponse>(client, body, signer.network);
}

/**
 * Signe une action user-signed avec le signer `label` (obligatoire) puis la poste sur son réseau.
 * `hyperliquidChain` est injecté depuis le réseau du signer.
 */
export function userSignedRequest<TResponse>(
  client: HyperliquidClient,
  args: {
    action: Record<string, unknown> & { signatureChainId: `0x${string}` };
    types: Eip712Types;
    nonce: number;
    label: string;
  },
): Promise<TResponse> {
  const signer = resolveSigner(client, args.label);
  const action = {
    ...args.action,
    hyperliquidChain: signer.network === 'testnet' ? 'Testnet' : 'Mainnet',
  };
  const signature = signUserSignedAction({
    privateKey: signer.privateKey,
    action,
    types: args.types,
  });
  return postExchange<TResponse>(client, { action, nonce: args.nonce, signature }, signer.network);
}

function parseJson<TResponse>(response: Response): Promise<TResponse> {
  return response.text().then((body) => {
    if (response.ok === false) {
      throw new HyperliquidApiError(
        response.status,
        body === '' ? `HTTP ${response.status}` : body,
      );
    }
    return JSON.parse(body) as TResponse;
  });
}

function parseExchange<TResponse>(response: Response): Promise<TResponse> {
  return response.text().then((body) => {
    if (response.ok === false) {
      throw new HyperliquidApiError(
        response.status,
        body === '' ? `HTTP ${response.status}` : body,
      );
    }
    const parsed = JSON.parse(body) as TResponse & { status?: string; response?: unknown };
    if (parsed.status === 'err') {
      throw new HyperliquidApiError(response.status, String(parsed.response));
    }
    return parsed;
  });
}
