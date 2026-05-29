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
  /**
   * Champs natifs **hors cœur unifié** (rien n'est jeté). **Optionnel** : omis si tout le natif
   * mappe le cœur. HL : `onlyIsolated`/`isDelisted` (perp), `tokens`/`index`/`isCanonical` (spot).
   */
  xtras?: Record<string, unknown>;
}

/**
 * Bougie OHLCV au **format unifié Blackcube** (clés courtes, cœur identique entre les SDK
 * hyperliquid/pacifica/aster). Prix et volumes sont des **chaînes décimales**.
 *
 * Le **cœur** (`t…kind`) regroupe les champs vraiment communs aux 3 exchanges.
 * `qv`/`tbbv`/`tbqv` sont nullables (renseignés par Aster, `null` chez HL/Pacifica).
 * `xtras` porte le reste non modélisé : **rien n'est jeté**, `toNative(toCommon(x)) ≡ x`.
 */
export interface Candle {
  /** Open time — début de la bougie (timestamp ms). */
  t: number;
  /** Close time — fin de la bougie (timestamp ms). */
  T: number;
  /** Symbol — coin (perp) ou paire (spot, ex. `@1`, `PURR/USDC`). */
  s: string;
  /** Interval — intervalle (ex. `1h`). */
  i: string;
  /** Open — prix d'ouverture. */
  o: string;
  /** Close — prix de clôture. */
  c: string;
  /** High — plus haut. */
  h: string;
  /** Low — plus bas. */
  l: string;
  /** Volume — volume en actif de base. */
  v: string;
  /** Number of trades — nombre de trades. */
  n: number;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Quote volume — `null` si l'exchange ne le fournit pas (cas HL). */
  qv: string | null;
  /** Taker buy base volume — `null` si non fourni. */
  tbbv: string | null;
  /** Taker buy quote volume — `null` si non fourni. */
  tbqv: string | null;
  /**
   * Reste des champs **non standard / non modélisés** (rien n'est jeté).
   * **Optionnel** : omis quand il n'y a rien à y mettre (cas HL).
   */
  xtras?: Record<string, unknown>;
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
