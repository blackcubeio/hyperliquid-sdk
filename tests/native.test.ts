import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';

// Surplus spécifique HL via le namespace `native` — lectures **publiques** sur mainnet réel.
const dex = new Hyperliquid();

describe('Hyperliquid — namespace native (mainnet réel, public)', () => {
  it('expose les capacités attendues', () => {
    for (const c of ['agents', 'transfers', 'marketData', 'advancedOrders']) {
      expect(typeof (dex.native as Record<string, unknown>)[c]).toBe('function');
    }
  });

  it('native.marketData().allMids()', async () => {
    const mids = (await dex.native.marketData().allMids()) as Record<string, unknown>;
    expect(Object.keys(mids).length).toBeGreaterThan(0);
  });

  it('native.marketData().metaAndAssetCtxs() + candleSnapshot()', async () => {
    const meta = await dex.native.marketData().metaAndAssetCtxs();
    expect(meta).toBeDefined();

    const now = Date.now();
    const candles = (await dex.native.marketData().candleSnapshot({
      coin: 'BTC',
      interval: '1h',
      startTime: now - 6 * 3600_000,
      endTime: now,
    })) as unknown[];
    expect(Array.isArray(candles)).toBe(true);
    expect(candles.length).toBeGreaterThan(0);
  });
});
