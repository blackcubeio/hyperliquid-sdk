import type { Balance } from '../common/types';
import { BalanceConverter, type BalanceNative } from '../converters/balance';
import { getClearinghouseStateSpot } from './info/get-clearinghouse-state-spot';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetBalancesParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
}

/**
 * Soldes **spot** par actif au **format unifié** `Balance` (HL `spotClearinghouseState`).
 * L'équité/collatéral perp est dans `getClearinghouseState` (spécifique HL).
 */
export function getBalances(params: GetBalancesParams, label?: string): Promise<Balance[]> {
  const converter = new BalanceConverter();
  return getClearinghouseStateSpot({ user: params.user as `0x${string}` }, label).then((state) =>
    state.balances.map((balance) => converter.toCommon(balance as BalanceNative)),
  );
}
