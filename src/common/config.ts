import { REST_URL, TESTNET_REST_URL, TESTNET_WS_URL, WS_URL } from './constants';
import type { Network, Signer } from './types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export interface InitOptions {
  /** Signers indexés par label (ex. `trader`, `tester`). Chaque signer porte son réseau. */
  signers?: Record<string, Signer>;
  fetch?: FetchLike;
  webSocket?: WebSocketFactory;
  /** Override des URLs REST par réseau. */
  restUrls?: Partial<Record<Network, string>>;
  /** Override des URLs WS par réseau. */
  wsUrls?: Partial<Record<Network, string>>;
}

/**
 * Contexte d'exécution **isolé** d'un SDK Hyperliquid : tout ce dont les fonctions REST/WS ont
 * besoin (fetch, urls, signers). Créé par {@link init} et **passé explicitement** à chaque
 * fonction (`getCandles(client, …)`) — il n'y a **plus de singleton global**, donc plusieurs
 * clients (comptes/réseaux différents) coexistent sans se piétiner.
 */
export interface HyperliquidClient {
  signers: Record<string, Signer>;
  fetch: FetchLike;
  webSocket: WebSocketFactory;
  restUrls: Record<Network, string>;
  wsUrls: Record<Network, string>;
}

/** Construit un {@link HyperliquidClient} isolé à partir des options. Aucun état global muté. */
export function init(options: InitOptions = {}): HyperliquidClient {
  const fetchImpl =
    options.fetch ??
    (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined);
  if (fetchImpl === undefined) {
    throw new Error('No fetch implementation available; pass options.fetch to init()');
  }
  const webSocket = options.webSocket ?? defaultWebSocketFactory();
  if (webSocket === undefined) {
    throw new Error('No WebSocket implementation available; pass options.webSocket to init()');
  }
  return {
    signers: options.signers ?? {},
    fetch: fetchImpl,
    webSocket,
    restUrls: {
      mainnet: options.restUrls?.mainnet ?? REST_URL,
      testnet: options.restUrls?.testnet ?? TESTNET_REST_URL,
    },
    wsUrls: {
      mainnet: options.wsUrls?.mainnet ?? WS_URL,
      testnet: options.wsUrls?.testnet ?? TESTNET_WS_URL,
    },
  };
}

function defaultWebSocketFactory(): WebSocketFactory | undefined {
  if (typeof globalThis.WebSocket !== 'function') {
    return undefined;
  }
  // Cast strictement nécessaire : le `WebSocket` du DOM/Node n'expose pas exactement notre
  // `WebSocketLike` (events typés différemment) mais en est un sur-ensemble compatible au runtime
  // (send/close/onopen/onmessage/onerror/onclose). Pont structurel volontaire, pas de dérive métier.
  return (url) => new globalThis.WebSocket(url) as unknown as WebSocketLike;
}
