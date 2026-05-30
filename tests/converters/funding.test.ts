import { describe, expect, it } from 'vitest';
import type { FundingRate } from '../../src/common/types';
import { FundingConverter, type FundingRateNative } from '../../src/converters/funding';

const FUNDING_CORE_KEYS = ['fundingRate', 'name', 'time'];

const WIRE: FundingRateNative = {
  coin: 'BTC',
  fundingRate: '0.0001',
  premium: '0.00005',
  time: 1_700_000_000_000,
};

describe('FundingConverter HL — bijectivité + conformité', () => {
  const conv = new FundingConverter();

  it('toCommon mappe le point (premium dans xtras)', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      name: 'BTC',
      fundingRate: '0.0001',
      time: 1_700_000_000_000,
      xtras: { premium: '0.00005' },
    } satisfies FundingRate);
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(FUNDING_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
