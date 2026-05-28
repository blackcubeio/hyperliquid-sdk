import { describe, expect, it } from 'vitest';
import { assetIndex } from '../src/common/utils';
import { buildModifyAction } from '../src/rest/exchange/modify-order';
import { buildScheduleCancelAction } from '../src/rest/exchange/schedule-cancel';
import { buildUpdateIsolatedMarginAction } from '../src/rest/exchange/update-isolated-margin';
import { buildUpdateLeverageAction } from '../src/rest/exchange/update-leverage';

describe('actions L1 supplémentaires', () => {
  it('buildModifyAction', () => {
    expect(
      buildModifyAction({ oid: 12345, order: { asset: 0, isBuy: true, price: 30000, size: 0.1 } }),
    ).toEqual({
      type: 'modify',
      oid: 12345,
      order: { a: 0, b: true, p: '30000', s: '0.1', r: false, t: { limit: { tif: 'Gtc' } } },
    });
  });

  it('buildUpdateLeverageAction', () => {
    expect(buildUpdateLeverageAction({ asset: 0, isCross: true, leverage: 5 })).toEqual({
      type: 'updateLeverage',
      asset: 0,
      isCross: true,
      leverage: 5,
    });
  });

  it('buildUpdateIsolatedMarginAction', () => {
    expect(buildUpdateIsolatedMarginAction({ asset: 0, isBuy: true, ntli: 1000000 })).toEqual({
      type: 'updateIsolatedMargin',
      asset: 0,
      isBuy: true,
      ntli: 1000000,
    });
  });

  it('buildScheduleCancelAction', () => {
    expect(buildScheduleCancelAction()).toEqual({ type: 'scheduleCancel' });
    expect(buildScheduleCancelAction({ time: 1234567890 })).toEqual({
      type: 'scheduleCancel',
      time: 1234567890,
    });
  });
});

describe('assetIndex', () => {
  it('trouve l’index ou lève', () => {
    const universe = [{ name: 'BTC' }, { name: 'ETH' }, { name: 'SOL' }];
    expect(assetIndex(universe, 'ETH')).toBe(1);
    expect(() => assetIndex(universe, 'DOGE')).toThrow();
  });
});
