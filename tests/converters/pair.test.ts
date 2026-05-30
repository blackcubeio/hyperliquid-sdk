import { describe, expect, it } from 'vitest';
import type { Pair } from '../../src/common/types';
import { PairConverter } from '../../src/converters/pair';
import type { AssetMeta } from '../../src/common/types';
import type { SpotPair, SpotToken } from '../../src/common/types';

const PERP: AssetMeta = {
  name: 'BTC',
  szDecimals: 5,
  maxLeverage: 50,
  isDelisted: false,
  kind: 'perp',
};

const SPOT: SpotPair = {
  name: 'PURR/USDC',
  tokens: [1, 0],
  index: 0,
  isCanonical: true,
  kind: 'spot',
};

const TOKENS = [
  { name: 'USDC', szDecimals: 8, index: 0 },
  { name: 'PURR', szDecimals: 2, index: 1 },
] as unknown as SpotToken[];

describe('PairConverter HL — bijectivité', () => {
  const conv = new PairConverter(TOKENS);

  it('perp : cœur extrait, reste dans xtras', () => {
    expect(conv.toCommon(PERP)).toEqual({
      name: 'BTC',
      base: 'BTC',
      quote: 'USDC',
      kind: 'perp',
      szDecimals: 5,
      maxLeverage: 50,
      stepSize: '0.00001',
      status: 'TRADING',
      xtras: { isDelisted: false },
    } satisfies Pair);
  });

  it('spot : base/quote résolus via tokens, reste dans xtras', () => {
    expect(conv.toCommon(SPOT)).toEqual({
      name: 'PURR/USDC',
      base: 'PURR',
      quote: 'USDC',
      kind: 'spot',
      szDecimals: 2,
      stepSize: '0.01',
      xtras: { tokens: [1, 0], index: 0, isCanonical: true },
    } satisfies Pair);
  });

  it('toNative(toCommon(x)) ≡ x — perp et spot', () => {
    expect(conv.toNative(conv.toCommon(PERP))).toEqual(PERP);
    expect(conv.toNative(conv.toCommon(SPOT))).toEqual(SPOT);
  });

  it('toCommon(toNative(pair)) ≡ pair — perp et spot', () => {
    const perp = conv.toCommon(PERP);
    const spot = conv.toCommon(SPOT);
    expect(conv.toCommon(conv.toNative(perp))).toEqual(perp);
    expect(conv.toCommon(conv.toNative(spot))).toEqual(spot);
  });
});
