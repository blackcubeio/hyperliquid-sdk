import { describe, expect, it } from 'vitest';
import { UserTradeConverter, type UserTradeNative } from '../../src/converters/user-trade';

const USER_TRADE_CORE_KEYS = [
  'fee',
  'feeAsset',
  'id',
  'kind',
  'maker',
  'name',
  'orderId',
  'pnl',
  'price',
  'side',
  'size',
  'time',
];

const WIRE: UserTradeNative = {
  coin: 'BTC',
  px: '74000.0',
  sz: '0.5',
  side: 'B',
  time: 1_700_000_000_000,
  startPosition: '0.0',
  dir: 'Open Long',
  closedPnl: '0.0',
  hash: '0xabc',
  oid: 123,
  crossed: true,
  fee: '0.5',
  tid: 88,
  feeToken: 'USDC',
};

describe('UserTradeConverter HL — bijectivité + conformité', () => {
  const conv = new UserTradeConverter();

  it('toCommon : side B->buy, maker=!crossed, natifs dans xtras', () => {
    const t = conv.toCommon(WIRE);
    expect(t.side).toBe('buy');
    expect(t.maker).toBe(false);
    expect(t.id).toBe('88');
    expect(t.orderId).toBe('123');
    expect(t.feeAsset).toBe('USDC');
    expect(t.xtras?.hash).toBe('0xabc');
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(USER_TRADE_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
