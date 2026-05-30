import { describe, expect, it } from 'vitest';
import type { Balance } from '../../src/common/types';
import { BalanceConverter, type BalanceNative } from '../../src/converters/balance';

const BALANCE_CORE_KEYS = ['asset', 'available', 'total', 'usdValue'];

const WIRE: BalanceNative = {
  coin: 'USDC',
  token: 0,
  hold: '10.0',
  total: '1000.0',
  entryNtl: '0.0',
};

describe('BalanceConverter HL — bijectivité + conformité', () => {
  const conv = new BalanceConverter();

  it('toCommon : total mappé, available null, reste dans xtras', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      asset: 'USDC',
      total: '1000.0',
      available: null,
      usdValue: null,
      xtras: { token: 0, hold: '10.0', entryNtl: '0.0' },
    } satisfies Balance);
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(BALANCE_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
