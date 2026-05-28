export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface Signer {
  /** Clé privée de l'API/agent wallet (0x…) qui signe pour ce compte. */
  privateKey: `0x${string}`;
  /** Adresse de vault / sub-account (0x…) incluse dans les actions L1 signées. */
  vaultAddress?: `0x${string}`;
}
