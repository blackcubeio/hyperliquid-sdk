import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { getCandleSnapshot } from '../src/rest/info/get-candle-snapshot';
import { getMetaAndAssetCtxs } from '../src/rest/info/get-meta-and-asset-ctxs';
import { getOpenOrders } from '../src/rest/info/get-open-orders';
import { getSpotMeta } from '../src/rest/info/get-spot-meta';

// Lectures /info réelles sur le mainnet (publiques sauf openOrders, testé sur adresse zéro).
describe('info — lectures supplémentaires (mainnet réel)', () => {
  beforeAll(() => {
    init();
  });

  it('getSpotMeta renvoie tokens et paires', async () => {
    const spot = await getSpotMeta();
    expect(spot.tokens.length).toBeGreaterThan(0);
    expect(spot.universe.length).toBeGreaterThan(0);
  });

  it('getMetaAndAssetCtxs aligne meta et contextes', async () => {
    const [meta, ctxs] = await getMetaAndAssetCtxs();
    expect(meta.universe[0]?.name).toBe('BTC');
    expect(ctxs.length).toBe(meta.universe.length);
    expect(typeof ctxs[0]?.markPx).toBe('string');
  });

  it('getCandleSnapshot renvoie des bougies BTC', async () => {
    const candles = await getCandleSnapshot({
      coin: 'BTC',
      interval: '1h',
      startTime: Date.now() - 6 * 3600 * 1000,
    });
    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe('BTC');
  });

  it('getOpenOrders renvoie un tableau (adresse zéro)', async () => {
    const orders = await getOpenOrders({
      user: '0x0000000000000000000000000000000000000000',
    });
    expect(Array.isArray(orders)).toBe(true);
  });
});
