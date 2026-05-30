import type { WebSocketFactory } from './config';
import type { JsonValue } from './types';

// ── depuis ws/client.ts ──
export type StreamHandler = (data: JsonValue) => void;

export type Unsubscribe = () => void;

export interface WsClientOptions {
  /** Label du signer (cf. init) : choisit le réseau du socket et signe les actions WS. */
  label?: string;
  url?: string;
  webSocket?: WebSocketFactory;
  /** Intervalle du ping (ms). HL ferme les connexions inactives après ~60 s. Défaut 50 s. */
  heartbeatIntervalMs?: number;
}
