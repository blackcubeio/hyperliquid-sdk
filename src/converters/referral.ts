/**
 * État de **parrainage** d'un compte (`getInfo`). Type **nommé** (pas d'équivalent commun) ;
 * code propre, parrain, nombre de filleuls. Le natif complet (états du code, récompenses détaillées)
 * reste dans `xtras`.
 */
export interface ReferralInfo {
  /** Code de parrainage du compte ; `null` si non défini. */
  code: string | null;
  /** Adresse du parrain ; `null` si aucun. */
  referredBy: string | null;
  /** Nombre de filleuls. */
  nReferred: number;
  /** Champs natifs hors cœur (états, récompenses…) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface ReferralNative {
  referredBy?: { code?: string; referrer?: string } | null;
  referrerState?: { stage?: string; data?: { code?: string } };
  cumVlm?: string;
  referredCount?: number;
  [key: string]: unknown;
}

/** Convertisseur **`referral` → {@link ReferralInfo}**. */
export class ReferralConverter {
  toCommon(wire: ReferralNative): ReferralInfo {
    return {
      code: wire.referrerState?.data?.code ?? null,
      referredBy: wire.referredBy?.referrer ?? null,
      nReferred: wire.referredCount ?? 0,
      xtras: wire as Record<string, unknown>,
    };
  }
}
