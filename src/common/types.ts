export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type Network = 'mainnet' | 'testnet';

/** Type de marché d'une paire : perpetual ou spot. */
export type MarketKind = 'perp' | 'spot';

export interface Signer {
  /** Clé privée de l'API/agent wallet (0x…) qui signe pour ce compte. */
  privateKey: `0x${string}`;
  /** Adresse du compte (master/sub) — utilisée pour les lectures. */
  publicKey: `0x${string}`;
  /** Réseau sur lequel ce signer opère. */
  network: Network;
  /** Adresse de vault / sub-account (0x…) incluse dans les actions L1 signées. */
  vaultAddress?: `0x${string}`;
}
