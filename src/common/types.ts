export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type Network = 'mainnet' | 'testnet';

/** Type de marché d'une paire : perpetual ou spot. */
export type MarketKind = 'perp' | 'spot';

/**
 * Paire/marché au **format unifié Blackcube** (mêmes champs entre les SDK
 * hyperliquid/pacifica/aster, calqués sur HL). Prix/quantités = **chaînes décimales**.
 * `raw` conserve l'objet d'origine **complet** de l'exchange : rien n'est jeté.
 */
export interface Pair {
  /** Nom/identifiant de la paire (HL: `name`, ex. `BTC`, `@1`). */
  name: string;
  /** Actif de base. */
  base: string;
  /** Actif de cotation. */
  quote: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Décimales de taille (HL: `szDecimals`) → pas de quantité = `10^-szDecimals`. */
  szDecimals: number;
  /** Levier max (perp uniquement), si fourni. */
  maxLeverage?: number;
  /** Pas de prix, si fourni (HL : dérivé par chiffres significatifs, absent ici). */
  tickSize?: string;
  /** Pas de quantité, si fourni. */
  stepSize?: string;
  /** Notionnel minimum d'un ordre, si fourni. */
  minNotional?: string;
  /** État du marché, si fourni. */
  status?: string;
  /** Objet d'origine **complet** renvoyé par l'exchange (aucune donnée jetée). */
  raw: Record<string, unknown>;
}

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
