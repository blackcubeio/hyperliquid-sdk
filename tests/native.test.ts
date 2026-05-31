import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';

// Surplus spécifique HL via le namespace `native` — lectures **publiques** sur mainnet réel.
const dex = new Hyperliquid();

describe('Hyperliquid — namespace native (mainnet réel, public)', () => {
  it('expose les capacités attendues', () => {
    for (const c of ['perp', 'account', 'agents']) {
      expect(typeof (dex.native as Record<string, unknown>)[c]).toBe('function');
    }
    // Miroir : surplus perp (reads marché + ordres avancés) sous `native.perp()`, PAS sur perp() commun.
    expect(typeof dex.native.perp().placeBatch).toBe('function');
    expect(typeof dex.native.perp().placeTwap).toBe('function');
    expect(typeof dex.native.perp().getAllMids).toBe('function');
    expect((dex.perp() as unknown as Record<string, unknown>).placeBatch).toBeUndefined();
    // `transfers` COMMUN (top-level) ; anciens scopes natifs disparus.
    expect(typeof dex.transfers).toBe('function');
    expect((dex.native as Record<string, unknown>).transfers).toBeUndefined();
    expect((dex.native as Record<string, unknown>).marketData).toBeUndefined();
    expect((dex.native as Record<string, unknown>).advancedOrders).toBeUndefined();
  });

  it('native.perp() — getPredictedFundings() + getPerpDexs()', async () => {
    const [pf, dexs] = await Promise.all([
      dex.native.perp().getPredictedFundings(),
      dex.native.perp().getPerpDexs(),
    ]);
    expect(pf).toBeDefined();
    expect(dexs).toBeDefined();
  });

  it('native.perp().getAllMids() → Mid[]', async () => {
    const mids = await dex.native.perp().getAllMids();
    expect(mids.length).toBeGreaterThan(0);
    expect(typeof mids[0]?.name).toBe('string');
    expect(typeof mids[0]?.mid).toBe('string');
  });

  it('native.perp().getMetaAndAssetCtxs() + getCandleSnapshot() → Candle[]', async () => {
    const meta = await dex.native.perp().getMetaAndAssetCtxs();
    expect(meta).toBeDefined();

    const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
    const now = Date.now();
    const candles = await dex.native.perp().getCandleSnapshot({
      name: 'BTC',
      interval: '1h',
      startTime: fmt(now - 6 * 3600_000),
      endTime: fmt(now),
    });
    expect(Array.isArray(candles)).toBe(true);
    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe('BTC');
  });
});
