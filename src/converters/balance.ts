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
    // `xtras` porte les champs spot natifs omis du cœur (`token`/`hold`/`entryNtl`) : on les
    // restitue explicitement (pas de double cast — la forme native est typée).
    const xtras = (balance.xtras ?? {}) as Partial<Omit<BalanceNative, 'coin' | 'total'>>;
    return {
      coin: balance.asset,
      total: balance.total,
      token: xtras.token ?? 0,
      hold: xtras.hold ?? '0',
      entryNtl: xtras.entryNtl ?? '0',
    };
  }
}
