import { describe, expect, it } from 'vitest';
import type { Candle } from '../../src/common/types';
import { CandleConverter, type CandleNative } from '../../src/rest/converters/candle';

// Bougie native HL (réponse candleSnapshot) — objet aux clés courtes, sans extras.
const WIRE: CandleNative = {
  t: 1_700_000_000_000,
  T: 1_700_003_599_999,
  s: 'BTC',
  i: '1h',
  o: '74000.0',
  c: '74250.0',
  h: '74500.0',
  l: '73800.0',
  v: '12.345',
  n: 321,
};

describe('CandleConverter HL — bijectivité totale', () => {
  const conv = new CandleConverter('perp');

  it('toCommon mappe le wire vers le format unifié (extras null/vides)', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      ...WIRE,
      kind: 'perp',
      qv: null,
      tbbv: null,
      tbqv: null,
      xtras: {},
    } satisfies Candle);
  });

  it('toNative(toCommon(wire)) ≡ wire (aucun champ perdu)', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });

  it('toCommon(toNative(candle)) ≡ candle', () => {
    const candle = conv.toCommon(WIRE);
    expect(conv.toCommon(conv.toNative(candle))).toEqual(candle);
  });

  it('porte le kind spot', () => {
    expect(new CandleConverter('spot').toCommon(WIRE).kind).toBe('spot');
  });
});
