export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type Network = 'mainnet' | 'testnet';

/** Chaîne hexadécimale préfixée `0x` (clé/adresse EVM). */
export type Hex = `0x${string}`;

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
  /** Meilleur bid ; `null` si non fourni. */
  bid: string | null;
  /** Meilleur ask ; `null` si non fourni. */
  ask: string | null;
  /** Dernier prix négocié ; `null` si non fourni. */
  last: string | null;
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
 * Exécution (fill) du compte au **format unifié Blackcube** (cœur identique entre SDK).
 * `side` = sens du fill, `maker` = rôle. `xtras` porte le natif hors cœur, omis si vide.
 */
export interface UserTrade {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** ID du fill/trade. */
  id: string;
  /** ID de l'ordre parent. */
  orderId: string;
  /** Sens. */
  side: Side;
  /** Prix d'exécution. */
  price: string;
  /** Taille exécutée. */
  size: string;
  /** Frais. */
  fee: string;
  /** Actif des frais ; `null` si non fourni. */
  feeAsset: string | null;
  /** PnL réalisé/clôturé ; `null` si non fourni. */
  pnl: string | null;
  /** Rôle maker ; `null` si non fourni. */
  maker: boolean | null;
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
 * Sous-compte au **format unifié Blackcube** (cœur identique entre SDK). Hyperliquid n'expose
 * pas de liste de sous-comptes : ce type fait partie du contrat commun mais n'est pas implémenté
 * ici (la classe `Hyperliquid` n'implémente pas `ISubAccounts`).
 */
export interface SubAccount {
  /** Adresse du sous-compte (ou du compte principal). */
  address: string;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/**
 * Trade public au **format unifié Blackcube** (cœur identique entre les SDK).
 * `side` = direction du **taker** (agresseur). `maker` = ce record est-il le maker
 * (`null` si modèle par-trade, ex. flux WS). `xtras` porte le natif hors cœur.
 * Hyperliquid n'a pas de trades publics REST ; ce type sert au flux WS `subscribeTrades`.
 */
export interface Trade {
  /** Prix d'exécution (chaîne décimale). */
  price: string;
  /** Taille exécutée (chaîne décimale). */
  size: string;
  /** Direction du taker/agresseur ; `null` si indéterminé. */
  side: Side | null;
  /** Ce record est-il le maker ; `null` si non applicable (modèle par-trade). */
  maker: boolean | null;
  /** Timestamp (ms). */
  time: number;
  /** ID de trade exchange ; `null` si non fourni. */
  id: number | null;
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

// ── depuis rest/cancel-all-orders.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK ; HL requiert `user`). */
export interface CancelAllOrdersParams {
  /** Adresse réelle du compte (requise côté HL). */
  user: string;
  /** Paire/symbole (= `Pair.name`) ; tous les marchés si omis. */
  name?: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Résultat unifié d'une annulation globale. */
export interface CancelAllResult {
  /** Nombre d'ordres annulés. */
  cancelled: number | null;
}

// ── depuis rest/cancel-order.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface CancelOrderParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** ID d'ordre exchange (oid). */
  id: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

// ── depuis rest/client.ts ──
export interface ResolvedSigner {
  label: string;
  account: `0x${string}`;
  privateKey: `0x${string}`;
  network: Network;
  vaultAddress?: `0x${string}`;
}

// ── depuis rest/edit-order.ts ──
/**
 * Paramètres unifiés. HL **remplace l'ordre entier** lors d'une modification → `side` requis
 * (contrairement à Aster/Pacifica qui ne changent que prix/quantité).
 */
export interface EditOrderParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Sens (requis côté HL — l'ordre est remplacé). */
  side: Side;
  /** Nouvelle quantité. */
  size: string;
  /** Nouveau prix. */
  price: string;
  /** ID d'ordre exchange (oid). */
  id: string;
  /** Reduce-only. */
  reduceOnly?: boolean;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Résultat unifié d'une modification d'ordre (référence du nouvel ordre). */
export interface EditOrderResult {
  name: string;
  id: string;
  xtras?: Record<string, unknown>;
}

// ── depuis rest/exchange/approve-agent.ts ──
export interface ApproveAgentParams {
  /** Adresse de l'API/agent wallet à autoriser. */
  agentAddress: `0x${string}`;
  /** Nom de l'agent ("" pour un agent non nommé). */
  agentName?: string;
  nonce?: number;
}

// ── depuis rest/exchange/cancel-by-cloid.ts ──
export interface CancelByCloidParams {
  asset: number;
  /** Client order ID (bytes16 hex). */
  cloid: `0x${string}`;
}

// ── depuis rest/exchange/cancel-order.ts ──
export interface CancelParams {
  /** Asset ID entier. */
  asset: number;
  /** Order ID (oid). */
  oid: number;
}

// ── depuis rest/exchange/modify-order.ts ──
export interface ModifyParams {
  /** Order ID de l'ordre à modifier. */
  oid: number;
  /** Nouvel ordre (remplace l'ancien). */
  order: OrderParams;
}

// ── depuis rest/exchange/place-order.ts ──
export type Tif = 'Gtc' | 'Ioc' | 'Alo';

export interface OrderParams {
  /** Asset ID entier (index dans `meta` pour les perps, `10000 + index` pour le spot). */
  asset: number;
  isBuy: boolean;
  price: number | string;
  size: number | string;
  reduceOnly?: boolean;
  /** Défaut : `Gtc`. */
  tif?: Tif;
  /** Client order ID (bytes16 hex, `0x…`). */
  cloid?: `0x${string}`;
  /** Prix de déclenchement (stop/take-profit). Présent ⇒ wire `trigger` au lieu de `limit`. */
  triggerPx?: number | string;
  /** Déclenché en marché (true, défaut) ou en limite au `price` (false). */
  isMarket?: boolean;
  /** Nature du déclencheur : `'sl'` (stop-loss) ou `'tp'` (take-profit). */
  tpsl?: 'tp' | 'sl';
}

export interface OrderWire {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t:
    | { limit: { tif: Tif } }
    | { trigger: { isMarket: boolean; triggerPx: string; tpsl: 'tp' | 'sl' } };
  c?: `0x${string}`;
}

// ── depuis rest/exchange/schedule-cancel.ts ──
export interface ScheduleCancelParams {
  /** Horodatage (ms) de l'annulation programmée (dead-man's switch). Omis/null = désactive. */
  time?: number | null;
}

// ── depuis rest/exchange/spot-send.ts ──
export interface SpotSendParams {
  destination: `0x${string}`;
  /** Identifiant du token au format `name:tokenId` (ex. "USDC:0x…"). */
  token: string;
  amount: string;
  time?: number;
}

// ── depuis rest/exchange/update-isolated-margin.ts ──
export interface UpdateIsolatedMarginParams {
  asset: number;
  /** Sens de la position (true = long). */
  isBuy: boolean;
  /** Marge à ajouter (négatif pour retirer), en micro-USD entier (USD × 1e6). */
  ntli: number;
}

// ── depuis rest/exchange/update-leverage.ts ──
/** Paramètres de l'action L1 `updateLeverage` (asset = index HL). */
export interface LeverageActionParams {
  asset: number;
  /** `true` = cross, `false` = isolé. */
  isCross: boolean;
  leverage: number;
}

// ── depuis rest/exchange/usd-class-transfer.ts ──
export interface UsdClassTransferParams {
  /** Montant USDC en chaîne. */
  amount: string;
  /** `true` = spot → perp, `false` = perp → spot. */
  toPerp: boolean;
  nonce?: number;
}

// ── depuis rest/exchange/usd-send.ts ──
export interface UsdSendParams {
  destination: `0x${string}`;
  /** Montant USDC en chaîne (ex. "100.5"). */
  amount: string;
  /** Horodatage ms (sert aussi de nonce) ; défaut `Date.now()`. */
  time?: number;
}

// ── depuis rest/exchange/withdraw.ts ──
/**
 * Paramètres unifiés de retrait (mêmes champs sur les 3 SDK ; chaque exchange lit ce qu'il
 * lui faut). HL : `address` = destination (requise), `amount` en USDC vers Arbitrum.
 */
export interface WithdrawParams {
  /** Montant USDC (chaîne). */
  amount: string;
  /** Adresse de destination (requise côté HL). */
  address?: string;
  /** Actif (Aster). */
  asset?: string;
  /** Chaîne de destination (Aster). */
  chainId?: string;
  /** Frais (Aster). */
  fee?: string;
  /** Nonce/temps (ms) ; défaut maintenant. */
  time?: number;
}

// ── depuis rest/get-balances.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetBalancesParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
}

// ── depuis rest/get-candles.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetCandlesParams {
  /** Identifiant de la paire (= `Pair.name`). */
  name: string;
  /** Intervalle (`1m`, `1h`, `1d`…). */
  interval: string;
  /** Début (ms). */
  startTime: number;
  /** Fin (ms), optionnel. */
  endTime?: number;
  /** Type de marché ; déduit du `name` chez HL, override possible. */
  kind?: MarketKind;
  /** Nombre max de bougies (ignoré par HL). */
  limit?: number;
}

// ── depuis rest/get-funding-history.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetFundingHistoryParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Début (ms) — requis par HL. */
  startTime: number;
  /** Fin (ms). */
  endTime?: number;
}

// ── depuis rest/get-open-orders.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetOpenOrdersParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
  /** Filtre optionnel sur une paire (appliqué côté client). */
  name?: string;
}

// ── depuis rest/get-order-book.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetOrderBookParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Type de marché ; défaut déduit du coin. */
  kind?: MarketKind;
  /** Ignoré par HL (carnet complet renvoyé). */
  limit?: number;
}

// ── depuis rest/get-positions.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetPositionsParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
  /** Filtre optionnel sur une paire (appliqué côté client). */
  name?: string;
}

// ── depuis rest/get-user-trades.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetUserTradesParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
  /** Filtre optionnel sur une paire (appliqué côté client). */
  name?: string;
}

// ── depuis rest/info/get-all-mids.ts ──
/** Prix mid de toutes les coins, indexés par nom de coin. */
export type AllMids = Record<string, string>;

// ── depuis rest/info/get-clearinghouse-state-spot.ts ──
export interface SpotBalance {
  coin: string;
  /** Index du token (cf. `getMetaSpot().tokens`). */
  token: number;
  hold: string;
  total: string;
  entryNtl: string;
}

export interface SpotClearinghouseState {
  balances: SpotBalance[];
}

// ── depuis rest/info/get-clearinghouse-state.ts ──
export interface MarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface PositionLeverage {
  type: string;
  value: number;
  rawUsd?: string;
}

export interface PositionCumFunding {
  allTime: string;
  sinceOpen: string;
  sinceChange: string;
}

/** Position perp native HL (utilisée par `getClearinghouseState`, spécifique). */
export interface PerpPosition {
  coin: string;
  szi: string;
  entryPx?: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  leverage: PositionLeverage;
  liquidationPx: string | null;
  marginUsed: string;
  maxLeverage: number;
  cumFunding: PositionCumFunding;
}

export interface AssetPosition {
  type: string;
  position: PerpPosition;
}

export interface ClearinghouseState {
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
}

// ── depuis rest/info/get-frontend-open-orders.ts ──
export interface FrontendOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: string;
  sz: string;
  timestamp: number;
  origSz: string;
  orderType: string;
  reduceOnly?: boolean;
  tif?: string | null;
  cloid?: string | null;
  isPositionTpsl?: boolean;
  isTrigger?: boolean;
  triggerPx?: string;
  triggerCondition?: string;
}

// ── depuis rest/info/get-meta-and-asset-ctxs-spot.ts ──
export interface SpotAssetCtx {
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
  midPx: string | null;
  circulatingSupply: string;
  coin: string;
  totalSupply: string;
  dayBaseVlm: string;
}

/**
 * `[metaSpot, contextes]` : l'univers spot + les contextes (mark/mid price, volumes, supply) par
 * paire. Le contexte porte son `coin` ; la liste des contextes n'est pas strictement alignée sur
 * `universe` (matcher par `coin`).
 */
export type SpotMetaAndAssetCtxs = [SpotMeta, SpotAssetCtx[]];

// ── depuis rest/info/get-meta-and-asset-ctxs.ts ──
export interface AssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string | null;
  oraclePx: string;
  markPx: string;
  midPx: string | null;
  impactPxs: string[] | null;
}

/** `[meta, contextes]` : l'univers + les contextes (mark price, funding, OI…) par actif, alignés par index. */
export type MetaAndAssetCtxs = [Meta, AssetCtx[]];

// ── depuis rest/info/get-meta-spot.ts ──
export interface SpotToken {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
  evmContract: string | null;
  fullName: string | null;
}

export interface SpotPair {
  name: string;
  /** `[baseTokenIndex, quoteTokenIndex]`. */
  tokens: [number, number];
  index: number;
  isCanonical: boolean;
  /** Toujours `'spot'` ici — distingue des perpetuals lors d'une fusion. */
  kind: MarketKind;
}

export interface SpotMeta {
  tokens: SpotToken[];
  universe: SpotPair[];
}

// ── depuis rest/info/get-meta.ts ──
export interface AssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
  /** Toujours `'perp'` ici — distingue des paires spot lors d'une fusion. */
  kind: MarketKind;
}

export interface Meta {
  universe: AssetMeta[];
  marginTables?: unknown[];
}

// ── depuis rest/info/get-open-orders.ts ──
/** Ordre ouvert natif HL (`openOrders`) — type consommé par `getOpenOrders` unifié. */
export interface OpenOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: string;
  sz: string;
  timestamp: number;
  origSz?: string;
  cloid?: string;
}

// ── depuis rest/info/get-order-status.ts ──
export interface OrderStatusResponse {
  /** "order" si trouvé, sinon "unknownOid". */
  status: string;
  order?: unknown;
}

// ── depuis rest/info/get-user-fills.ts ──
/** Fill natif HL (`userFills`) — type consommé par `getUserTrades` unifié et `getUserFillsByTime`. */
export interface UserFill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
}

// ── depuis rest/place-order.ts ──
/** Type d'ordre unifié supporté par HL (`placeOrder`). */
export type PlaceOrderType =
  | 'limit'
  | 'market'
  | 'stop'
  | 'stopMarket'
  | 'takeProfit'
  | 'takeProfitMarket';

/** Time-in-force unifié. */
export type PlaceOrderTif = 'gtc' | 'ioc' | 'fok' | 'alo';

/** Un take-profit partiel d'une protection (déclenchement + taille ; `price` = borne d'exécution). */
export interface ProtectionTp {
  triggerPrice: string;
  size: string;
  /** Prix limite/borne de l'ordre déclenché (HL l'exige ; Aster l'ignore — conditionnel market). */
  price?: string;
}

/**
 * Entrée `placeProtection` : SL plein + N TPs partiels (reduce-only) sur une position EXISTANTE.
 * `side` = sens de la POSITION (les ordres sont posés au sens OPPOSÉ). Tailles + `price` (borne)
 * fournis par l'appelant — pas de recalcul interne (anti-résidu garanti côté appelant).
 */
export interface PlaceProtectionParams {
  name: string;
  side: Side;
  sl: { triggerPrice: string; size: string; price?: string };
  tps: ProtectionTp[];
  clientId?: string;
}

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface PlaceOrderParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Sens. */
  side: Side;
  /** Type d'ordre (`limit` ou `market` = IOC borné par `price`). */
  type: PlaceOrderType;
  /** Quantité (chaîne décimale). */
  size: string;
  /** Prix (limite, ou borne de slippage pour `market` — requis côté HL). */
  price: string;
  /** Prix de déclenchement — requis pour les types stop/takeProfit ; `price` reste la borne d'exécution. */
  triggerPrice?: string;
  /** Time-in-force (limit). */
  tif?: PlaceOrderTif;
  /** Reduce-only. */
  reduceOnly?: boolean;
  /** Client order id (bytes16 hex `0x…`). */
  clientId?: `0x${string}`;
}

// ── depuis rest/types.ts ──
export interface Signature {
  r: `0x${string}`;
  s: `0x${string}`;
  v: number;
}

export interface Eip712Field {
  name: string;
  type: string;
}

export type Eip712Types = Record<string, readonly Eip712Field[]>;

export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}

// ── depuis rest/update-leverage.ts ──
/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface UpdateLeverageParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Levier cible (entier). */
  leverage: number;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Mode cross (`true`, défaut) ou isolé (`false`) — spécifique HL. */
  isCross?: boolean;
}

/** Confirmation unifiée d'un changement de levier. */
export interface LeverageUpdate {
  name: string;
  leverage: number;
  xtras?: Record<string, unknown>;
}
