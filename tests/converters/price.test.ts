import { describe, expect, it } from 'vitest';
import type { Price } from '../../src/common/types';
import { PriceConverter, type PriceNative } from '../../src/rest/converters/price';

const WIRE: PriceNative = {
  funding: '0.0001',
  openInterest: '1234.5',
  prevDayPx: '73000.0',
  dayNtlVlm: '987654321.0',
  premium: '0.0002',
  oraclePx: '73990.0',
  markPx: '74000.0',
  midPx: '74000.5',
  impactPxs: ['73999.0', '74001.0'],
};

describe('PriceConverter HL — bijectivité', () => {
  const conv = new PriceConverter('BTC');

  it('toCommon mappe le contexte (premium/impactPxs dans xtras, time null)', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      name: 'BTC',
      kind: 'perp',
      mark: '74000.0',
      oracle: '73990.0',
      mid: '74000.5',
      funding: '0.0001',
      openInterest: '1234.5',
      volume24h: '987654321.0',
      prevDayPrice: '73000.0',
      time: null,
      xtras: { premium: '0.0002', impactPxs: ['73999.0', '74001.0'] },
    } satisfies Price);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });

  it('toCommon(toNative(price)) ≡ price', () => {
    const price = conv.toCommon(WIRE);
    expect(conv.toCommon(conv.toNative(price))).toEqual(price);
  });
});
