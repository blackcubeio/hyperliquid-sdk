import type { HyperliquidClient } from '../common/config';
import type { GetBalancesParams } from '../common/types';
import type { Balance } from '../common/types';
import { BalanceConverter, type BalanceNative } from '../converters/balance';
import { getClearinghouseStateSpot } from './info/get-clearinghouse-state-spot';

/**
 * Soldes **spot** par actif au **format unifié** `Balance` (HL `spotClearinghouseState`).
 * L'équité/collatéral perp est dans `getClearinghouseState` (spécifique HL).
 */
export function getBalances(
  client: HyperliquidClient,
  params: GetBalancesParams,
  label?: string,
): Promise<Balance[]> {
  const converter = new BalanceConverter();
  return getClearinghouseStateSpot(client, { user: params.user as `0x${string}` }, label).then(
    (state) => state.balances.map((balance) => converter.toCommon(balance as BalanceNative)),
  );
}
