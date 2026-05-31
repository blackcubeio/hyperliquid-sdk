import type { FrontendOrder, Order } from '../common/types';
import { FrontendOrderConverter } from './frontend-order';

// ── getFees ───────────────────────────────────────────────────────────────────
/**
 * Récapitulatif des **frais** d'un compte (`getFees`). Type **nommé** (pas d'équivalent commun) ;
 * taux maker/taker perp + spot, remise de parrainage, volume cumulé. Le natif complet (barème,
 * paliers, séries) reste dans `xtras`.
 */
export interface AccountFees {
  /** Taux taker (cross) perp — chaîne décimale (ex. `"0.00045"`). */
  crossRate: string;
  /** Taux maker (add) perp — chaîne décimale. */
  addRate: string;
  /** Taux taker (cross) spot ; `null` si non fourni. */
  spotCrossRate: string | null;
  /** Taux maker (add) spot ; `null` si non fourni. */
  spotAddRate: string | null;
  /** Remise de parrainage active ; `null` si aucune. */
  referralDiscount: string | null;
  /** Volume de trading du jour ; `null` si non fourni. */
  dailyVolume: string | null;
  /** Champs natifs hors cœur (barème, paliers…) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface UserFeesNative {
  userCrossRate?: string;
  userAddRate?: string;
  userSpotCrossRate?: string;
  userSpotAddRate?: string;
  activeReferralDiscount?: string;
  dailyUserVlm?: unknown;
  [key: string]: unknown;
}

/** Convertisseur **`userFees` → {@link AccountFees}**. */
export class AccountFeesConverter {
  toCommon(wire: UserFeesNative): AccountFees {
    return {
      crossRate: wire.userCrossRate ?? '0',
      addRate: wire.userAddRate ?? '0',
      spotCrossRate: wire.userSpotCrossRate ?? null,
      spotAddRate: wire.userSpotAddRate ?? null,
      referralDiscount: wire.activeReferralDiscount ?? null,
      dailyVolume: typeof wire.dailyUserVlm === 'string' ? wire.dailyUserVlm : null,
      xtras: wire as Record<string, unknown>,
    };
  }
}

// ── getPortfolio ────────────────────────────────────────────────────────────────
/**
 * Fenêtre de **portefeuille** (`getPortfolio`). HL renvoie `[[window, { accountValueHistory,
 * pnlHistory, vlm }], …]` ; on expose une entrée **nommée** par fenêtre. Les historiques sont des
 * séries `[timestampMs, valeur]`.
 */
export interface PortfolioWindow {
  /** Fenêtre temporelle (`day`/`week`/`month`/`allTime`/`perpDay`…). */
  window: string;
  /** Série `[time(ms), valeur de compte]`. */
  accountValueHistory: [number, string][];
  /** Série `[time(ms), PnL]`. */
  pnlHistory: [number, string][];
  /** Volume sur la fenêtre ; `null` si non fourni. */
  volume: string | null;
  /** Champs natifs hors cœur — rien jeté. */
  xtras: Record<string, unknown>;
}

interface PortfolioEntryNative {
  accountValueHistory?: [number, string][];
  pnlHistory?: [number, string][];
  vlm?: string;
  [key: string]: unknown;
}
type PortfolioNative = [string, PortfolioEntryNative][];

/** Convertisseur **`portfolio` → {@link PortfolioWindow}[]**. */
export class PortfolioConverter {
  toCommon(wire: PortfolioNative): PortfolioWindow[] {
    return (wire ?? []).map(([window, entry]) => ({
      window,
      accountValueHistory: entry.accountValueHistory ?? [],
      pnlHistory: entry.pnlHistory ?? [],
      volume: entry.vlm ?? null,
      xtras: entry as Record<string, unknown>,
    }));
  }
}

// ── getFunding ────────────────────────────────────────────────────────────────
/**
 * Paiement de **funding** reçu/payé par le compte (`getFunding`). Type **nommé** (le `FundingRate`
 * commun modélise le taux *de marché*, pas un paiement de compte) ; champs alignés sur le commun
 * (`name`/`time`). HL : `{ time, hash, delta:{ coin, usdc, szi, fundingRate, nSamples } }`.
 */
export interface FundingPayment {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Montant USDC du paiement (chaîne décimale, signé). */
  amount: string;
  /** Taux de funding appliqué (chaîne décimale). */
  rate: string;
  /** Timestamp (ms). */
  time: number;
  /** Champs natifs hors cœur (hash, szi, nSamples…) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface FundingDeltaNative {
  coin?: string;
  usdc?: string;
  fundingRate?: string;
  [key: string]: unknown;
}
interface UserFundingNative {
  time: number;
  hash?: string;
  delta: FundingDeltaNative;
}

/** Convertisseur **`userFunding` → {@link FundingPayment}[]**. */
export class FundingPaymentConverter {
  toCommon(wire: UserFundingNative[]): FundingPayment[] {
    return (wire ?? []).map((row) => ({
      name: row.delta.coin ?? '',
      amount: row.delta.usdc ?? '0',
      rate: row.delta.fundingRate ?? '0',
      time: row.time,
      xtras: { hash: row.hash, ...row.delta },
    }));
  }
}

// ── getLedger ────────────────────────────────────────────────────────────────
/**
 * Mouvement de **ledger hors funding** (`getLedger`) : dépôt, retrait, transfert, liquidation… Type
 * **nommé** ; HL : `{ time, hash, delta:{ type, usdc, … } }`. `amount` = `usdc` quand présent.
 */
export interface LedgerUpdate {
  /** Type de mouvement (`deposit`/`withdraw`/`accountClassTransfer`/`liquidation`…). */
  type: string;
  /** Montant USDC du mouvement (chaîne décimale) ; `null` si non monétaire. */
  amount: string | null;
  /** Timestamp (ms). */
  time: number;
  /** Champs natifs hors cœur (hash, détails du delta) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface LedgerDeltaNative {
  type?: string;
  usdc?: string;
  [key: string]: unknown;
}
interface LedgerRowNative {
  time: number;
  hash?: string;
  delta: LedgerDeltaNative;
}

/** Convertisseur **`userNonFundingLedgerUpdates` → {@link LedgerUpdate}[]**. */
export class LedgerConverter {
  toCommon(wire: LedgerRowNative[]): LedgerUpdate[] {
    return (wire ?? []).map((row) => ({
      type: row.delta.type ?? 'other',
      amount: row.delta.usdc ?? null,
      time: row.time,
      xtras: { hash: row.hash, ...row.delta },
    }));
  }
}

// ── getRole ────────────────────────────────────────────────────────────────
/** Rôle d'un compte (`getRole`). Type **nommé** ; HL : `{ role, data? }`. */
export interface AccountRole {
  /** Rôle : `missing`/`user`/`agent`/`vault`/`subAccount`. */
  role: string;
  /** Détails natifs selon le rôle (ex. master d'un sous-compte) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface UserRoleNative {
  role?: string;
  [key: string]: unknown;
}

/** Convertisseur **`userRole` → {@link AccountRole}**. */
export class AccountRoleConverter {
  toCommon(wire: UserRoleNative): AccountRole {
    return { role: wire.role ?? 'missing', xtras: wire as Record<string, unknown> };
  }
}

// ── getRateLimit ────────────────────────────────────────────────────────────────
/** Limites de requêtes d'un compte (`getRateLimit`). Type **nommé** ; HL : `{ cumVlm, nRequestsUsed, nRequestsCap }`. */
export interface RateLimit {
  /** Volume de trading cumulé (chaîne décimale). */
  cumVolume: string;
  /** Requêtes déjà consommées. */
  used: number;
  /** Plafond de requêtes autorisées. */
  cap: number;
  /** Champs natifs hors cœur — rien jeté. */
  xtras: Record<string, unknown>;
}

interface RateLimitNative {
  cumVlm?: string;
  nRequestsUsed?: number;
  nRequestsCap?: number;
  [key: string]: unknown;
}

/** Convertisseur **`userRateLimit` → {@link RateLimit}**. */
export class RateLimitConverter {
  toCommon(wire: RateLimitNative): RateLimit {
    return {
      cumVolume: wire.cumVlm ?? '0',
      used: wire.nRequestsUsed ?? 0,
      cap: wire.nRequestsCap ?? 0,
      xtras: wire as Record<string, unknown>,
    };
  }
}

// ── getHistoricalOrders ────────────────────────────────────────────────────────
/** Statut HL d'un ordre historique → statut unifié {@link Order.status}. */
const HIST_STATUS: Record<string, Order['status']> = {
  open: 'open',
  filled: 'filled',
  canceled: 'canceled',
  marginCanceled: 'canceled',
  reduceOnlyCanceled: 'canceled',
  liquidatedCanceled: 'canceled',
  rejected: 'rejected',
  expired: 'expired',
  triggered: 'open',
};

/** Élément natif de `historicalOrders` : `{ order: FrontendOrder, status, statusTimestamp }`. */
export interface HistoricalOrderNative {
  order: FrontendOrder;
  status: string;
  statusTimestamp?: number;
}

/**
 * Convertisseur **`historicalOrders` → {@link Order}[]** : réutilise {@link FrontendOrderConverter}
 * (le `order` enveloppé a la forme native frontend) puis applique le `status` final HL.
 */
export class HistoricalOrderConverter {
  private readonly orders = new FrontendOrderConverter();

  toCommon(wire: HistoricalOrderNative): Order {
    const order = this.orders.toCommon(wire.order);
    order.status = HIST_STATUS[wire.status] ?? 'other';
    order.xtras = {
      ...order.xtras,
      statusRaw: wire.status,
      statusTimestamp: wire.statusTimestamp,
    };
    return order;
  }
}
