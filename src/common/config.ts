import { REST_URL, TESTNET_REST_URL, TESTNET_WS_URL, WS_URL } from './constants';

export type Network = 'mainnet' | 'testnet';

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
  network?: Network;
  restUrl?: string;
  wsUrl?: string;
  fetch?: FetchLike;
  webSocket?: WebSocketFactory;
  /** Clé privée de l'API/agent wallet (0x…) pour signer les actions `/exchange`. */
  privateKey?: `0x${string}`;
  /** Adresse de vault / sub-account (0x…) incluse dans les actions L1 signées. */
  vaultAddress?: `0x${string}`;
}

export interface HyperliquidConfig {
  restUrl: string;
  wsUrl: string;
  isTestnet: boolean;
  fetch: FetchLike;
  webSocket: WebSocketFactory;
  privateKey?: `0x${string}`;
  vaultAddress?: `0x${string}`;
}

let config: HyperliquidConfig | null = null;

export function init(options: InitOptions = {}): void {
  const network = options.network ?? 'mainnet';
  const isTestnet = network === 'testnet';
  const restUrl = options.restUrl ?? (isTestnet ? TESTNET_REST_URL : REST_URL);
  const wsUrl = options.wsUrl ?? (isTestnet ? TESTNET_WS_URL : WS_URL);
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
    restUrl,
    wsUrl,
    isTestnet,
    fetch: fetchImpl,
    webSocket,
    privateKey: options.privateKey,
    vaultAddress: options.vaultAddress,
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
