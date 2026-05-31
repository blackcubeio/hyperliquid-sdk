// Types **nommés** des lectures de vaults (pas d'équivalent commun). Montants = chaîne décimale,
// timestamps = ms ; natif complet dans `xtras`.

/** Équité d'un compte dans un vault qu'il suit (`getEquities`). */
export interface VaultEquity {
  /** Adresse du vault. */
  vaultAddress: string;
  /** Équité du compte dans ce vault (chaîne décimale). */
  equity: string;
  /** Verrou des fonds jusqu'à (ms) ; `null` si non verrouillé. */
  lockedUntil: number | null;
  /** Champs natifs hors cœur — rien jeté. */
  xtras: Record<string, unknown>;
}

interface VaultEquityNative {
  vaultAddress?: string;
  equity?: string;
  lockedUntilTimestamp?: number;
  [key: string]: unknown;
}

/** Convertisseur **`userVaultEquities` → {@link VaultEquity}[]**. */
export class VaultEquityConverter {
  toCommon(wire: VaultEquityNative[]): VaultEquity[] {
    return (wire ?? []).map((row) => ({
      vaultAddress: row.vaultAddress ?? '',
      equity: row.equity ?? '0',
      lockedUntil: row.lockedUntilTimestamp ?? null,
      xtras: row as Record<string, unknown>,
    }));
  }
}

/** Détails d'un vault (`getDetails`). Cœur lisible + natif complet (followers, performance) dans `xtras`. */
export interface VaultDetails {
  /** Nom du vault. */
  name: string;
  /** Adresse du vault. */
  vaultAddress: string;
  /** Adresse du leader (gestionnaire). */
  leader: string;
  /** Description ; `null` si absente. */
  description: string | null;
  /** Le vault accepte-t-il les dépôts ; `null` si non fourni. */
  allowDeposits: boolean | null;
  /** Champs natifs hors cœur (portfolio, followers, apr…) — rien jeté. */
  xtras: Record<string, unknown>;
}

interface VaultDetailsNative {
  name?: string;
  vaultAddress?: string;
  leader?: string;
  description?: string;
  allowDeposits?: boolean;
  [key: string]: unknown;
}

/** Convertisseur **`vaultDetails` → {@link VaultDetails}**. */
export class VaultDetailsConverter {
  toCommon(wire: VaultDetailsNative): VaultDetails {
    return {
      name: wire.name ?? '',
      vaultAddress: wire.vaultAddress ?? '',
      leader: wire.leader ?? '',
      description: wire.description ?? null,
      allowDeposits: wire.allowDeposits ?? null,
      xtras: wire as Record<string, unknown>,
    };
  }
}
