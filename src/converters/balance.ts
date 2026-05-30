import type { Balance } from '../common/types';
import type { SpotBalance } from '../common/types';

/** Solde spot natif HL (`spotClearinghouseState`). */
export type BalanceNative = SpotBalance;

/**
 * Convertisseur **bijectif** solde : `toCommon(native) → Balance` / inverse.
 * `total` mappé ; HL ne fournit pas de « available » direct (`hold` = bloqué) → `available=null`.
 * `token`/`hold`/`entryNtl` → `xtras` → bijection totale.
 */
export class BalanceConverter {
  toCommon(wire: BalanceNative): Balance {
    const { coin, total, ...rest } = wire;
    return {
      asset: coin,
      total,
      available: null,
      usdValue: null,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(balance: Balance): BalanceNative {
    return {
      coin: balance.asset,
      total: balance.total,
      ...balance.xtras,
    } as unknown as BalanceNative;
  }
}
