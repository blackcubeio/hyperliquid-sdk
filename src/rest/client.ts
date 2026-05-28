import { getConfig } from '../common/config';
import { EXCHANGE_PATH, INFO_PATH } from '../common/constants';
import type { JsonValue } from '../common/types';
import { signL1Action } from './signing';
import type { Signature } from './types';

export class HyperliquidApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HyperliquidApiError';
  }
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

export interface ExchangeOptions {
  /** Adresse de vault / sub-account ; par défaut celle de `init()`. */
  vaultAddress?: `0x${string}`;
  /** Expiration de l'action (ms epoch). */
  expiresAfter?: number;
  /** Nonce (ms) ; par défaut `Date.now()`. */
  nonce?: number;
}

/** Signe une action L1 (order, cancel, modify…) puis la poste sur `/exchange`. */
export function exchangeL1Action<TResponse>(
  action: Record<string, unknown>,
  options: ExchangeOptions = {},
): Promise<TResponse> {
  const config = getConfig();
  if (config.privateKey === undefined) {
    throw new Error(
      'Clé privée absente ; passe privateKey à init() pour signer les actions /exchange',
    );
  }
  const vaultAddress = options.vaultAddress ?? config.vaultAddress;
  const nonce = options.nonce ?? Date.now();
  const signature = signL1Action({
    privateKey: config.privateKey,
    action,
    nonce,
    isTestnet: config.isTestnet,
    vaultAddress,
    expiresAfter: options.expiresAfter,
  });
  return postExchange<TResponse>(
    buildExchangeBody(action, nonce, signature, vaultAddress, options.expiresAfter),
  );
}

function buildExchangeBody(
  action: Record<string, unknown>,
  nonce: number,
  signature: Signature,
  vaultAddress: `0x${string}` | undefined,
  expiresAfter: number | undefined,
): Record<string, unknown> {
  const body: Record<string, unknown> = { action, nonce, signature };
  if (vaultAddress !== undefined) {
    body.vaultAddress = vaultAddress;
  }
  if (expiresAfter !== undefined) {
    body.expiresAfter = expiresAfter;
  }
  return body;
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
