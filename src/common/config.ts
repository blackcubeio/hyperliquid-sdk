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

export interface HyperliquidConfig {
  signers: Record<string, Signer>;
  fetch: FetchLike;
  webSocket: WebSocketFactory;
  restUrls: Record<Network, string>;
  wsUrls: Record<Network, string>;
}

let config: HyperliquidConfig | null = null;

export function init(options: InitOptions = {}): void {
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
  config = {
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
  return (url) => new globalThis.WebSocket(url) as unknown as WebSocketLike;
}

export function getConfig(): HyperliquidConfig {
  if (config === null) {
    throw new Error('Hyperliquid SDK not initialized; call init() first');
  }
  return config;
}

export function resetConfig(): void {
  config = null;
}
