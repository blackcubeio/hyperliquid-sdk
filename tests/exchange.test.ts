import { describe, expect, it } from 'vitest';
import { floatToWire } from '../src/common/utils';
import { buildCancelAction } from '../src/rest/exchange/cancel-order';
import { buildOrderAction } from '../src/rest/exchange/place-order';
import { signL1Action } from '../src/rest/signing';

const PRIVATE_KEY = '0x822e9959e022b78423eb653a62ea0020cd283e71a2a8133a6ff2aeffaf373cff';

describe('floatToWire', () => {
  it('formate sans zéros de fin', () => {
    expect(floatToWire(30000)).toBe('30000');
    expect(floatToWire(0.1)).toBe('0.1');
    expect(floatToWire(1.001)).toBe('1.001');
    expect(floatToWire(0)).toBe('0');
  });
});

describe('buildOrderAction', () => {
  it("relaie le grouping demandé ('normalTpsl' : TP/SL enfants de l'entrée, annulés par HL avec le parent)", () => {
    const action = buildOrderAction(
      [{ asset: 0, isBuy: true, price: 30000, size: 0.1 }],
      'normalTpsl',
    );
    expect((action as { grouping: string }).grouping).toBe('normalTpsl');
    // Le défaut reste 'na' — aucun appelant existant ne change de comportement.
    expect(
      (
        buildOrderAction([{ asset: 0, isBuy: true, price: 30000, size: 0.1 }]) as {
          grouping: string;
        }
      ).grouping,
    ).toBe('na');
  });

  it("produit le wire du vecteur et signe iso (lie l'action au cœur signature)", () => {
    const action = buildOrderAction([{ asset: 0, isBuy: true, price: 30000, size: 0.1 }]);
    expect(action).toEqual({
      type: 'order',
      orders: [{ a: 0, b: true, p: '30000', s: '0.1', r: false, t: { limit: { tif: 'Gtc' } } }],
      grouping: 'na',
    });
    expect(signL1Action({ privateKey: PRIVATE_KEY, action, nonce: 1234567890 })).toEqual({
      r: '0x61078d8ffa3cb591de045438a1ae2ed299b271891d1943a33901e7cfb3a31ed8',
      s: '0x0e91df4f9841641d3322dad8d932874b74d7e082cdb5b533f804964a6963aef9',
      v: 28,
    });
  });
});

describe('buildCancelAction', () => {
  it('produit le wire cancel', () => {
    expect(buildCancelAction([{ asset: 0, oid: 12345 }])).toEqual({
      type: 'cancel',
      cancels: [{ a: 0, o: 12345 }],
    });
  });
});
