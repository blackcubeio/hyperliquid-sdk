// Types **nommés** des lectures de staking HYPE (pas d'équivalent commun). Champs alignés sur le
// vocabulaire commun (`amount`/`time` = chaîne décimale / ms) ; natif complet dans `xtras`.

/** Délégation de staking en cours vers un validateur (`getDelegations`). */
export interface Delegation {
  /** Adresse du validateur. */
  validator: string;
  /** Montant délégué (chaîne décimale, HYPE). */
  amount: string;
  /** Verrou jusqu'à (ms) ; `null` si non verrouillé. */
  lockedUntil: number | null;
  /** Champs natifs hors cœur — rien jeté. */
  xtras: Record<string, unknown>;
}

interface DelegationNative {
  validator?: string;
  amount?: string;
  lockedUntilTimestamp?: number;
  [key: string]: unknown;
}

/** Convertisseur **`delegations` → {@link Delegation}[]**. */
export class DelegationConverter {
  toCommon(wire: DelegationNative[]): Delegation[] {
    return (wire ?? []).map((row) => ({
      validator: row.validator ?? '',
      amount: row.amount ?? '0',
      lockedUntil: row.lockedUntilTimestamp ?? null,
      xtras: row as Record<string, unknown>,
    }));
  }
}

/** Résumé de staking d'un compte (`getSummary`). */
export interface StakingSummary {
  /** Montant délégué (chaîne décimale). */
  delegated: string;
  /** Montant non-staké disponible (chaîne décimale). */
  undelegated: string;
  /** Total en cours de retrait (chaîne décimale). */
  totalPendingWithdrawal: string;
  /** Nombre de retraits en cours. */
  nPendingWithdrawals: number;
  /** Champs natifs hors cœur — rien jeté. */
  xtras: Record<string, unknown>;
}

interface StakingSummaryNative {
  delegated?: string;
  undelegated?: string;
  totalPendingWithdrawal?: string;
  nPendingWithdrawals?: number;
  [key: string]: unknown;
}

/** Convertisseur **`delegatorSummary` → {@link StakingSummary}**. */
export class StakingSummaryConverter {
  toCommon(wire: StakingSummaryNative): StakingSummary {
    return {
      delegated: wire.delegated ?? '0',
      undelegated: wire.undelegated ?? '0',
      totalPendingWithdrawal: wire.totalPendingWithdrawal ?? '0',
      nPendingWithdrawals: wire.nPendingWithdrawals ?? 0,
      xtras: wire as Record<string, unknown>,
    };
  }
}

/** Opération d'historique de staking (`getHistory`) : delegate/undelegate, dépôt/retrait… */
export interface StakingDelta {
  /** Type d'opération (`delegate`/`cDeposit`/`withdraw`…). */
  type: string;
  /** Montant (chaîne décimale) ; `null` si non monétaire. */
  amount: string | null;
  /** Timestamp (ms). */
  time: number;
  /** Champs natifs hors cœur (hash, validateur…) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface StakingDeltaNative {
  time: number;
  hash?: string;
  delta: { type?: string; amount?: string; wei?: string; [key: string]: unknown };
}

/** Convertisseur **`delegatorHistory` → {@link StakingDelta}[]**. */
export class StakingHistoryConverter {
  toCommon(wire: StakingDeltaNative[]): StakingDelta[] {
    return (wire ?? []).map((row) => ({
      type: row.delta.type ?? 'other',
      amount: row.delta.amount ?? row.delta.wei ?? null,
      time: row.time,
      xtras: { hash: row.hash, ...row.delta },
    }));
  }
}

/** Récompense de staking accumulée (`getRewards`). */
export interface StakingReward {
  /** Source de la récompense (validateur/programme). */
  source: string;
  /** Montant cumulé (chaîne décimale). */
  amount: string;
  /** Timestamp (ms) ; `null` si non fourni. */
  time: number | null;
  /** Champs natifs hors cœur — rien jeté. */
  xtras: Record<string, unknown>;
}

interface StakingRewardNative {
  source?: string;
  totalAmount?: string;
  time?: number;
  [key: string]: unknown;
}

/** Convertisseur **`delegatorRewards` → {@link StakingReward}[]**. */
export class StakingRewardConverter {
  toCommon(wire: StakingRewardNative[]): StakingReward[] {
    return (wire ?? []).map((row) => ({
      source: row.source ?? '',
      amount: row.totalAmount ?? '0',
      time: row.time ?? null,
      xtras: row as Record<string, unknown>,
    }));
  }
}
