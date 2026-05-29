import { describe, expect, it } from 'vitest';
import { OrderConverter, type OrderNative } from '../../src/rest/converters/order';

const ORDER_CORE_KEYS = [
  'clientId',
  'filled',
  'id',
  'kind',
  'name',
  'price',
  'reduceOnly',
  'side',
  'size',
  'status',
  'tif',
  'time',
  'type',
];

const WIRE: OrderNative = {
  coin: 'BTC',
  limitPx: '74000.0',
  oid: 999,
  side: 'B',
  sz: '0.5',
  timestamp: 1_700_000_000_000,
  origSz: '1.0',
  cloid: '0x01',
};

describe('OrderConverter HL — bijectivité + conformité', () => {
  const conv = new OrderConverter();

  it('toCommon : side B->buy, type limit, filled = origSz - sz, natifs dans xtras', () => {
    const o = conv.toCommon(WIRE);
    expect(o.name).toBe('BTC');
    expect(o.side).toBe('buy');
    expect(o.type).toBe('limit');
    expect(o.status).toBe('open');
    expect(o.size).toBe('1.0');
    expect(o.filled).toBe('0.5');
    expect(o.id).toBe('999');
    expect(o.xtras?.side).toBe('B');
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(ORDER_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
