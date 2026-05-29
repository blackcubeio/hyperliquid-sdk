import { describe, expect, it } from 'vitest';
import { PositionConverter, type PositionNative } from '../../src/rest/converters/position';

const POSITION_CORE_KEYS = [
  'entryPrice',
  'leverage',
  'liquidationPrice',
  'margin',
  'markPrice',
  'name',
  'side',
  'size',
  'unrealizedPnl',
];

const WIRE = {
  coin: 'BTC',
  szi: '-0.5',
  entryPx: '74000.0',
  positionValue: '37000.0',
  unrealizedPnl: '-5.0',
  returnOnEquity: '-0.01',
  leverage: { type: 'cross', value: 20 },
  liquidationPx: '90000.0',
  marginUsed: '1850.0',
  maxLeverage: 50,
  cumFunding: { allTime: '1.0', sinceOpen: '0.5', sinceChange: '0.2' },
} as unknown as PositionNative;

describe('PositionConverter HL — bijectivité + conformité', () => {
  const conv = new PositionConverter();

  it('toCommon : side/size du szi signé, leverage dérivé, markPrice null', () => {
    const pos = conv.toCommon(WIRE);
    expect(pos.name).toBe('BTC');
    expect(pos.side).toBe('short');
    expect(pos.size).toBe('0.5');
    expect(pos.leverage).toBe(20);
    expect(pos.markPrice).toBeNull();
    expect(pos.margin).toBe('1850.0');
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(POSITION_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
