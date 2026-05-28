import { getConfig } from '../common/config';
import { EXCHANGE_PATH, INFO_PATH } from '../common/constants';
import type { JsonValue, Signer } from '../common/types';
import { signL1Action, signUserSignedAction } from './signing';
import type { Eip712Types } from './types';

export class HyperliquidApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HyperliquidApiError';
  }
}

export interface ResolvedSigner {
  account: string;
  privateKey: `0x${string}`;
  vaultAddress?: `0x${string}`;
}

/**
 * Résout le signataire d'un appel signé depuis le registre fourni à `init()`.
 * - `account` fourni → le signataire enregistré pour ce compte.
 * - `account` omis → l'unique signataire enregistré, sinon lève (0 ou 2+).
 */
export function resolveSigner(account?: string): ResolvedSigner {
  const { signers } = getConfig();
  if (account !== undefined) {
    const signer = signers[account];
    if (signer === undefined) {
      throw new Error(
        `Aucun signataire enregistré pour ${account}; ajoute-le dans init({ signers })`,
      );
    }
    return { account, privateKey: signer.privateKey, vaultAddress: signer.vaultAddress };
  }
  const accounts = Object.keys(signers);
  if (accounts.length !== 1) {
    throw new Error('account requis : 0 ou plusieurs signataires enregistrés dans init()');
  }
  const onlyAccount = accounts[0] as string;
  const signer = signers[onlyAccount] as Signer;
  return { account: onlyAccount, privateKey: signer.privateKey, vaultAddress: signer.vaultAddress };
}

/** Requête de lecture (non signée) vers `POST /info`. */
export function infoRequest<TResponse>(body: Record<string, JsonValue>): Promise<TResponse> {
  const config = getConfig();
  return config
    .fetch(config.restUrl + INFO_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    .then((response) => parseJson<TResponse>(response));
}

/** POST brut vers `/exchange` (body déjà construit et signé). */
export function postExchange<TResponse>(body: Record<string, unknown>): Promise<TResponse> {
  const config = getConfig();
  return config
    .fetch(config.restUrl + EXCHANGE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    .then((response) => parseExchange<TResponse>(response));
}

/** Signe une action L1 (order, cancel, modify…) pour `account` puis la poste sur `/exchange`. */
export function exchangeL1Action<TResponse>(
  action: Record<string, unknown>,
  account?: string,
): Promise<TResponse> {
  const config = getConfig();
  const signer = resolveSigner(account);
  const nonce = Date.now();
  const signature = signL1Action({
    privateKey: signer.privateKey,
    action,
    nonce,
    isTestnet: config.isTestnet,
    vaultAddress: signer.vaultAddress,
  });
  const body: Record<string, unknown> = { action, nonce, signature };
  if (signer.vaultAddress !== undefined) {
    body.vaultAddress = signer.vaultAddress;
  }
  return postExchange<TResponse>(body);
}

/**
 * Signe une action user-signed (transferts, retraits, approbation d'agent…) pour `account`
 * puis la poste sur `/exchange`. `hyperliquidChain` est injecté depuis le réseau configuré.
 */
export function userSignedRequest<TResponse>(args: {
  action: Record<string, unknown> & { signatureChainId: `0x${string}` };
  types: Eip712Types;
  nonce: number;
  account?: string;
}): Promise<TResponse> {
  const config = getConfig();
  const signer = resolveSigner(args.account);
  const action = {
    ...args.action,
    hyperliquidChain: config.isTestnet ? 'Testnet' : 'Mainnet',
  };
  const signature = signUserSignedAction({
    privateKey: signer.privateKey,
    action,
    types: args.types,
  });
  return postExchange<TResponse>({ action, nonce: args.nonce, signature });
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
