import type { FundingRate } from '../common/types';

/** Point de funding natif HL (`fundingHistory`). */
export interface FundingRateNative {
  coin: string;
  fundingRate: string;
  premium: string;
  time: number;
}

/**
 * Convertisseur **bijectif** funding : `toCommon(native) → FundingRate` / inverse.
 * `premium` (hors cœur) → `xtras` → bijection totale.
 */
export class FundingConverter {
  toCommon(wire: FundingRateNative): FundingRate {
    return {
      name: wire.coin,
      fundingRate: wire.fundingRate,
      time: wire.time,
      xtras: { premium: wire.premium },
    };
  }

  toNative(funding: FundingRate): FundingRateNative {
    const xtras = funding.xtras ?? {};
    return {
      coin: funding.name,
      fundingRate: funding.fundingRate,
      premium: xtras.premium as string,
      time: funding.time,
    };
  }
}
