export const REST_URL = 'https://api.hyperliquid.xyz';
export const WS_URL = 'wss://api.hyperliquid.xyz/ws';

export const TESTNET_REST_URL = 'https://api.hyperliquid-testnet.xyz';
export const TESTNET_WS_URL = 'wss://api.hyperliquid-testnet.xyz/ws';

export const INFO_PATH = '/info';
export const EXCHANGE_PATH = '/exchange';

// ── Robustesse WebSocket (spec commune aux 4 SDK DEX) ──
// Reconnexion : backoff exponentiel plafonné + jitter, reset après stabilité.
export const RECONNECT_BASE_MS = 500; // délai de base
export const RECONNECT_FACTOR = 2; // facteur exponentiel
export const RECONNECT_CAP_MS = 30_000; // plafond du délai
export const RECONNECT_JITTER = 0.2; // ±20 %
export const RECONNECT_STABLE_MS = 10_000; // connexion « stable » → reset du compteur
/**
 * Heartbeat HL : ping périodique. HL ferme les connexions inactives après ~60 s ; on garde
 * **50 s** (exception HL documentée vs les 30 s des autres SDK).
 */
export const HEARTBEAT_INTERVAL_MS = 50_000;
/**
 * Idle-timeout HL : reconnect forcé si aucun message reçu. **65 s** (exception HL : laisse passer
 * un cycle de ping de 50 s + marge, vs 45 s des autres SDK).
 */
export const IDLE_TIMEOUT_MS = 65_000;
/** Délai d'attente d'une réponse `post` (requête/réponse WS) avant rejet. */
export const ACTION_TIMEOUT_MS = 10_000;
/** Throttle d'émission des (dé)abonnements : 1 subscription par message, espacés de 60 ms. */
export const WS_SUB_CHUNK = 1;
export const WS_SUB_INTERVAL_MS = 60;
