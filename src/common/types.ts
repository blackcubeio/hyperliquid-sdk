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

/** Niveau de carnet au **format unifié** (prix + taille ; `n` = nb d'ordres, `null` si non fourni). */
export interface OrderBookLevel {
  /** Prix du niveau (chaîne décimale). */
  price: string;
  /** Taille cumulée au niveau (chaîne décimale). */
  size: string;
  /** Nombre d'ordres au niveau ; `null` si l'exchange ne le fournit pas. */
  n: number | null;
}

/**
 * Carnet d'ordres au **format unifié Blackcube** (cœur identique entre les SDK).
 * `bids` décroissants, `asks` croissants. `time` = timestamp ms (`null` si non fourni).
 * `xtras` porte le natif hors cœur (rien jeté), omis si vide.
 */
export interface OrderBook {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Niveaux acheteurs (prix décroissant). */
  bids: OrderBookLevel[];
  /** Niveaux vendeurs (prix croissant). */
  asks: OrderBookLevel[];
  /** Timestamp du carnet (ms) ; `null` si non fourni. */
  time: number | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/**
 * Snapshot de prix d'un marché au **format unifié Blackcube** (cœur identique entre les SDK).
 * Chaque exchange remplit ce qu'il fournit ; le reste est `null`. `xtras` porte le hors-cœur.
 */
export interface Price {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Mark price ; `null` si non fourni. */
  mark: string | null;
  /** Oracle/index price ; `null` si non fourni. */
  oracle: string | null;
  /** Mid price ; `null` si non fourni. */
  mid: string | null;
  /** Funding rate courant ; `null` si non fourni. */
  funding: string | null;
  /** Open interest ; `null` si non fourni. */
  openInterest: string | null;
  /** Volume 24h (notionnel) ; `null` si non fourni. */
  volume24h: string | null;
  /** Prix de clôture de la veille ; `null` si non fourni. */
  prevDayPrice: string | null;
  /** Timestamp (ms) ; `null` si non fourni. */
  time: number | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/**
 * Position ouverte au **format unifié Blackcube** (cœur identique entre SDK).
 * `side`/`size`/`leverage` dérivés (source native dans `xtras`). Champs nullables si non fournis.
 */
export interface Position {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Sens : `long`/`short` (`null` si plate). */
  side: 'long' | 'short' | null;
  /** Taille absolue (chaîne décimale, sans signe). */
  size: string;
  /** Prix d'entrée ; `null` si non fourni. */
  entryPrice: string | null;
  /** Mark price ; `null` si non fourni. */
  markPrice: string | null;
  /** PnL non réalisé ; `null` si non fourni. */
  unrealizedPnl: string | null;
  /** Levier ; `null` si non fourni. */
  leverage: number | null;
  /** Prix de liquidation ; `null` si non fourni. */
  liquidationPrice: string | null;
  /** Marge engagée ; `null` si non fournie. */
  margin: string | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/** Côté d'un ordre/trade : achat ou vente. */
export type Side = 'buy' | 'sell';

/**
 * Ordre au **format unifié Blackcube** (cœur identique entre SDK). Type-pivot partagé
 * par les lectures (`getOpenOrders`/`getOrderHistory`) et le trading (`placeOrder`…).
 * `side`/`type`/`status`/`tif` sont des littéraux unifiés (sources natives dans `xtras`).
 */
export interface Order {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** ID d'ordre exchange. */
  id: string;
  /** Client order id ; `null` si absent. */
  clientId: string | null;
  /** Sens. */
  side: Side;
  /** Type d'ordre unifié. */
  type:
    | 'limit'
    | 'market'
    | 'stop'
    | 'stopMarket'
    | 'takeProfit'
    | 'takeProfitMarket'
    | 'trailingStop'
    | 'other';
  /** Prix limite ; `null` si non applicable (marché). */
  price: string | null;
  /** Quantité demandée (chaîne décimale). */
  size: string;
  /** Quantité exécutée. */
  filled: string;
  /** Statut unifié. */
  status: 'open' | 'partiallyFilled' | 'filled' | 'canceled' | 'rejected' | 'expired' | 'other';
  /** Time-in-force unifié ; `null` si non fourni. */
  tif: 'gtc' | 'ioc' | 'fok' | 'alo' | null;
  /** Reduce-only ; `null` si non fourni. */
  reduceOnly: boolean | null;
  /** Timestamp (ms). */
  time: number;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/**
 * Solde d'un actif au **format unifié Blackcube** (cœur identique entre SDK).
 * `available`/`usdValue` `null` si non fournis. `xtras` porte le natif hors cœur, omis si vide.
 */
export interface Balance {
  /** Actif (ex. `USDC`, `PURR`). */
  asset: string;
  /** Solde total (chaîne décimale). */
  total: string;
  /** Disponible (chaîne décimale) ; `null` si non fourni. */
  available: string | null;
  /** Valeur en USD ; `null` si non fournie. */
  usdValue: string | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/**
 * Point d'historique de **taux de funding** au format unifié (cœur identique entre SDK).
 * `xtras` porte le natif hors cœur (premium HL…), omis si vide.
 */
export interface FundingRate {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Taux de funding (chaîne décimale). */
  fundingRate: string;
  /** Timestamp du funding (ms). */
  time: number;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
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
