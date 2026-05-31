import type { SubAccount } from '../common/types';

/** Sous-compte natif HL (`subAccounts`) — `{ name, subAccountUser, master, clearinghouseState, … }`. */
export interface SubAccountNative {
  subAccountUser?: string;
  name?: string;
  master?: string;
  [key: string]: unknown;
}

/**
 * Convertisseur **`subAccounts` → {@link SubAccount}[]** (type **commun**) : `address = subAccountUser`,
 * le reste (nom, master, état de marge) dans `xtras`. HL renvoie `null` si le master n'a aucun
 * sous-compte → liste vide.
 */
export class SubAccountConverter {
  toCommon(wire: SubAccountNative[] | null): SubAccount[] {
    return (wire ?? []).map((row) => ({
      address: row.subAccountUser ?? '',
      xtras: row as Record<string, unknown>,
    }));
  }
}
