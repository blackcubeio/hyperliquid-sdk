import type {
  Balance,
  Candle,
  FundingRate,
  Order,
  OrderBook,
  Pair,
  Position,
  Price,
  SubAccount,
  Trade,
  UserTrade,
} from '../common/types';
import type { Unsubscribe } from '../common/ws';
import type { Ack } from '../converters/ack';

/**
 * Contrat **commun aux 3 DEX** (Aster / Hyperliquid / Pacifica). Décomposé en interfaces par
 * **capacité** : chaque DEX implémente celles qu'il possède. Ces interfaces sont **identiques**
 * dans les 3 dépôts (copiées) ; on ne les étend que par ajout (jamais de signature divergente).
 *
 * Les types métier (`Candle`, `Order`…) sont les types **unifiés Blackcube** (cœur identique
 * entre SDK). Le `kind` (perp/spot) n'est PAS dans les params : il est porté par le **scope**
 * (`dex.perp()` / `dex.spot()`).
 */

// ── Paramètres (sans `kind` : le scope le porte) ──────────────────────────────

export interface CandlesParams {
  name: string;
  interval: string;
  startTime?: string; // datetime UTC "YYYY-MM-DD HH:MM:SS" (C7)
  endTime?: string; // datetime UTC "YYYY-MM-DD HH:MM:SS" (C7)
  limit?: number;
}
export interface OrderBookParams {
  name: string;
  limit?: number;
}
export interface TradesParams {
  name: string;
  limit?: number;
}
export interface FundingParams {
  name: string;
  startTime?: string; // datetime UTC "YYYY-MM-DD HH:MM:SS" (C7)
  endTime?: string; // datetime UTC "YYYY-MM-DD HH:MM:SS" (C7)
  limit?: number;
}
export interface SymbolParams {
  name: string;
}

export interface PlaceOrderParams {
  name: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop' | 'stopMarket' | 'takeProfit' | 'takeProfitMarket';
  size: string;
  price?: string;
  triggerPrice?: string;
  tif?: 'gtc' | 'ioc' | 'fok' | 'alo';
  reduceOnly?: boolean;
  clientId?: string;
  /**
   * Slippage max en % (ordres `market` sans `price`). HL n'a pas de market natif : c'est un IOC borné par un prix
   * limite. Sans `price`, la borne est dérivée du mark courant ± `slippagePercent` (défaut `1`). → market uniforme
   * avec les autres DEX, sans exiger de prix de l'appelant. Ignoré si `price` est fourni.
   */
  slippagePercent?: string;
}
export interface CancelOrderParams {
  name: string;
  id?: string;
  clientId?: string;
}
export interface CancelAllParams {
  name: string;
}
export interface EditOrderParams {
  name: string;
  id?: string;
  clientId?: string;
  side: 'buy' | 'sell';
  size: string;
  price?: string;
}
export interface LeverageParams {
  name: string;
  leverage: number;
}
export interface MarginModeParams {
  name: string;
  isolated: boolean;
}
export interface IsolatedMarginParams {
  name: string;
  amount: string;
}
export interface WithdrawParams {
  amount: string;
  address?: string;
  asset?: string;
  [extra: string]: unknown;
}

// ── Capacités MARCHÉ (retournées par perp() / spot()) ─────────────────────────

/** Données de marché publiques (les 3 DEX). */
export interface IMarketData {
  getPairs(): Promise<Pair[]>;
  getCandles(query: CandlesParams): Promise<Candle[]>;
  getOrderBook(query: OrderBookParams): Promise<OrderBook>;
  getPrices(): Promise<Price[]>;
  getFundingHistory(query: FundingParams): Promise<FundingRate[]>;
}

/** Métadonnées de marché du produit (infos d'échange, symboles…). */
export interface IMarketMeta {
  /**
   * Brut volontaire — **pas de forme commune cross-DEX** : chaque venue renvoie une structure de
   * métadonnées d'échange différente (univers HL `meta`/`spotMeta`, exchangeInfo Aster…). Passe-plat
   * non normalisé (le natif est documenté par DEX). Le `unknown` ici est **assumé**, pas un oubli.
   */
  getExchangeInfo(): Promise<unknown>;
}

/** Historique de trades publics en REST (Aster, Pacifica — pas HL). */
export interface IPublicTrades {
  getTrades(query: TradesParams): Promise<Trade[]>;
}

/** Un take-profit partiel d'une protection (déclenchement + taille ; `price` = borne d'exécution). */
export interface ProtectionTp {
  triggerPrice: string;
  size: string;
  price?: string;
}

/**
 * Entrée `placeProtection` : SL plein + N TPs partiels (reduce-only) sur une position EXISTANTE.
 * `side` = sens de la POSITION ; les ordres sont posés au sens OPPOSÉ. Tailles + `price` (borne)
 * fournis par l'appelant — pas de recalcul interne (anti-résidu).
 */
export interface PlaceProtectionParams {
  name: string;
  side: 'buy' | 'sell';
  sl: { triggerPrice: string; size: string; price?: string };
  tps: ProtectionTp[];
  clientId?: string;
}

/** Placement/annulation/édition d'ordres + levier (les 3 DEX). */
export interface ITrading {
  place(input: PlaceOrderParams): Promise<Order>;
  cancel(input: CancelOrderParams): Promise<void>;
  cancelAll(input: CancelAllParams): Promise<{ cancelled: number | null }>;
  /**
   * Pose SL + N TPs (reduce-only) sur une position EXISTANTE, en un lot. Mécanisme natif par DEX
   * (HL : batch `grouping:positionTpsl` ; Aster : batch de conditionnels ; Pacifica : `placeTpsl`/`placeStop`).
   */
  placeProtection(input: PlaceProtectionParams): Promise<Order[]>;
  /** Annule la protection (SL/TPs reduce-only) de la paire — à appeler avant de la re-poser. */
  cancelProtection(input: { name: string }): Promise<void>;
  /**
   * Modifie un ordre. Contrainte DEX : `edit` ne renvoie que **l'identité du nouvel ordre**
   * (`{ name, id }`), **pas** un snapshot complet comme `place()` → `Order`. La modification
   * remplace l'ordre côté venue ; l'état complet doit être relu (`getOpens`/`getById`).
   */
  edit(input: EditOrderParams): Promise<{ name: string; id: string }>;
  updateLeverage(input: LeverageParams): Promise<unknown>;
}

/** Mode de marge cross/isolated (les 3 ; HL le traduit en updateLeverage(isCross)). */
export interface IMarginMode {
  setMarginMode(input: MarginModeParams): Promise<void>;
}

/** Ajout de marge isolée (les 3 DEX). */
export interface IIsolatedMargin {
  addIsolatedMargin(input: IsolatedMarginParams): Promise<void>;
}

/** Retrait de marge isolée (Aster, HL — pas Pacifica). */
export interface IRemovableMargin {
  removeIsolatedMargin(input: IsolatedMarginParams): Promise<void>;
}

// ── Compte PAR PRODUIT (retourné par perp() / spot()) ─────────────────────────

/** Lectures de compte liées au produit (perp ou spot), portées par le scope marché. */
export interface IProductAccount {
  getPositions(query?: SymbolParams): Promise<Position[]>;
  getOpens(query?: SymbolParams): Promise<Order[]>;
  getUserTrades(query?: SymbolParams): Promise<UserTrade[]>;
  /**
   * Brut volontaire — **pas de forme commune cross-DEX** : l'état de compte (clearinghouse HL,
   * account Aster…) diffère par venue. Passe-plat non normalisé (le natif est documenté par DEX).
   * Le `unknown` ici est **assumé**, pas un oubli.
   */
  getAccountInfo(): Promise<unknown>;
}

/** Historique des ordres du produit (Aster, Pacifica — pas HL). */
export interface IOrderHistory {
  getHistory(query?: SymbolParams): Promise<Order[]>;
}

// ── Capacités COMPTE TRANSVERSE (retournées par account()) ────────────────────

/** Compte transverse (sans notion de produit) : soldes + retrait (les 3 DEX). */
export interface IAccount {
  getBalances(): Promise<Balance[]>;
  /**
   * Retrait. Renvoie un {@link Ack} commun (`ok` + `xtras` = réponse native complète, rien jeté) :
   * le contrat commun n'est **pas** plus laxiste que le natif (qui n'a plus d'`unknown`).
   */
  withdraw(input: WithdrawParams): Promise<Ack>;
}

/** Liste des sous-comptes (Aster, Pacifica — pas HL). */
export interface ISubAccounts {
  getSubAccounts(): Promise<SubAccount[]>;
}

/** Endpoint d'un transfert : le couple `from`/`to` dit OÙ vont les fonds (C7/unifié). */
export type TransferEndpoint =
  | { wallet: 'perp' | 'spot' } // mon wallet perp / spot (transfert interne)
  | { account: string } // un autre compte (adresse ; Lighter = index de compte en string)
  | { subAccount: string }; // un de mes sous-comptes

/** Paramètres unifiés d'un transfert de fonds. */
export interface TransferParams {
  from?: TransferEndpoint; // source ; défaut = compte/wallet courant
  to: TransferEndpoint; // destination
  asset?: string; // défaut 'USDC'
  amount: string; // chaîne décimale
}

/** **LE** domaine pour bouger des fonds. Chaque DEX implémente les combinaisons `from/to` supportées. */
export interface ITransfers {
  transfer(params: TransferParams): Promise<unknown>;
}

/**
 * **Kill-switch / dead-man's switch serveur** : annule TOUS les ordres après `afterMs` ms de
 * silence, à rafraîchir périodiquement (heartbeat). Capacité **non universelle** — seules les
 * venues qui l'offrent côté serveur l'implémentent (HL `scheduleCancel`, Aster `countdownCancelAll`,
 * Lighter `ScheduledCancelAll`). **Pacifica n'a pas de DMS serveur → ne l'implémente pas** (le bot
 * doit alors faire tourner un watchdog externe). Jamais simulé côté client (mourrait avec le process).
 */
export interface IDeadManSwitch {
  /** Arme/rafraîchit l'annulation auto de tous les ordres après `afterMs` ms sans nouvel appel. */
  armCancelAll(afterMs: number): Promise<unknown>;
  /** Désarme le kill-switch. */
  disarm(): Promise<unknown>;
}

// ── SYSTÈME (retourné par system()) : connectivité, ni compte ni marché ───────

/** Connectivité / horloge serveur (les 3 DEX). */
export interface ISystem {
  ping(): Promise<void>;
  getServerTime(): Promise<number>;
}

// ── HELPERS crypto (retournés par helpers()) ──────────────────────────────────

/** Commun aux deux familles de clés. */
export interface KeyHelper {
  keyTypeOf(privateKey: string): 'evm' | 'solana';
}

/** Helpers EVM (Aster, Hyperliquid). */
export interface EvmHelper {
  privateKeyToAddress(privateKey: string): string;
  toChecksumAddress(address: string): string;
}

/** Helpers Solana / ed25519 (Aster, Pacifica). */
export interface SolanaHelper {
  solanaAddress(privateKey: string): string;
  signEd25519(msg: string, privateKey: string): string;
}

// ── Capacités TEMPS RÉEL (retournées par ws()) ────────────────────────────────
// Pas de connect/disconnect : lazy-connect au 1er subscribe, auto-close au dernier unsubscribe.

/** Souscriptions temps réel communes aux 3 DEX. */
export interface IRealtime {
  subscribeCandles(query: { name: string; interval: string }, cb: (c: Candle) => void): Unsubscribe;
  subscribeOrderBook(query: { name: string }, cb: (b: OrderBook) => void): Unsubscribe;
  subscribeTrades(query: { name: string }, cb: (t: Trade) => void): Unsubscribe;
  subscribeBbo(query: { name: string }, cb: (b: OrderBook) => void): Unsubscribe;
  subscribePrices(cb: (p: Price[]) => void): Unsubscribe;
  subscribeOrders(cb: (o: Order) => void): Unsubscribe;
  subscribeUserTrades(cb: (t: UserTrade) => void): Unsubscribe;
  /**
   * Bougies 1m de TOUT le marché en UNE souscription (flux de prix agrégé reconstruit par symbole) : close exact,
   * OHLC échantillonné, volume non porté par le flux agrégé → `0`. Évite N souscriptions `@candle` (cap/throttle
   * par connexion + crawl de re-souscription au reconnect). Commune aux DEX (chaque venue son adaptateur).
   */
  subscribeAllCandles(cb: (c: Candle) => void): Unsubscribe;
}

/** Souscription aux positions (Aster, Pacifica — pas HL). */
export interface IRealtimePositions {
  subscribePositions(cb: (p: Position) => void): Unsubscribe;
}
