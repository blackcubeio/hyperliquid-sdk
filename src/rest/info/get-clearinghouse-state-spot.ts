import { infoRequest } from '../client';

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

/**
 * Soldes **spot** d'un compte (par token : total, bloqué `hold`).
 * @param params `user` = adresse réelle du compte master/sub (jamais l'agent wallet).
 */
export function getClearinghouseStateSpot(
  params: { user: `0x${string}` },
  label?: string,
): Promise<SpotClearinghouseState> {
  return infoRequest<SpotClearinghouseState>(
    { type: 'spotClearinghouseState', user: params.user },
    label,
  );
}
