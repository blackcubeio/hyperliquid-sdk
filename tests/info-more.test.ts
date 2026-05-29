import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { getPairs } from '../src/rest/get-pairs';
import { getCandleSnapshot, marketKindFromCoin } from '../src/rest/info/get-candle-snapshot';
import { getClearinghouseStateSpot } from '../src/rest/info/get-clearinghouse-state-spot';
import { getMetaAndAssetCtxs } from '../src/rest/info/get-meta-and-asset-ctxs';
import { getMetaAndAssetCtxsSpot } from '../src/rest/info/get-meta-and-asset-ctxs-spot';
import { getMetaSpot } from '../src/rest/info/get-meta-spot';
import { getOpenOrders } from '../src/rest/info/get-open-orders';

// Lectures /info réelles sur le mainnet (publiques sauf openOrders, testé sur adresse zéro).
describe('info — lectures supplémentaires (mainnet réel)', () => {
  beforeAll(() => {
    init();
  });

  it('getMetaSpot renvoie tokens et paires taguées spot', async () => {
    const spot = await getMetaSpot();
    expect(spot.tokens.length).toBeGreaterThan(0);
    expect(spot.universe.length).toBeGreaterThan(0);
    expect(spot.universe[0]?.kind).toBe('spot');
  });

  it('getMetaAndAssetCtxsSpot renvoie meta spot et contextes', async () => {
    const [meta, ctxs] = await getMetaAndAssetCtxsSpot();
    expect(meta.universe.length).toBeGreaterThan(0);
    expect(ctxs.length).toBeGreaterThan(0);
    expect(typeof ctxs[0]?.markPx).toBe('string');
    expect(typeof ctxs[0]?.coin).toBe('string');
  });

  it('getClearinghouseStateSpot renvoie des balances (adresse zéro)', async () => {
    const state = await getClearinghouseStateSpot({
      user: '0x0000000000000000000000000000000000000000',
    });
    expect(Array.isArray(state.balances)).toBe(true);
  });

  it('getMetaAndAssetCtxs aligne meta et contextes', async () => {
    const [meta, ctxs] = await getMetaAndAssetCtxs();
    expect(meta.universe[0]?.name).toBe('BTC');
    expect(ctxs.length).toBe(meta.universe.length);
    expect(typeof ctxs[0]?.markPx).toBe('string');
  });

  it('getPairs renvoie le format unifié (perp + spot)', async () => {
    const pairs = await getPairs();
    expect(pairs.length).toBeGreaterThan(0);
    const btc = pairs.find((p) => p.base === 'BTC' && p.kind === 'perp');
    expect(btc?.name).toBe('BTC');
    expect(btc?.quote).toBe('USDC');
    expect(typeof btc?.szDecimals).toBe('number');
    expect(typeof btc?.maxLeverage).toBe('number');
    expect(typeof btc?.xtras).toBe('object');
    expect(pairs.some((p) => p.kind === 'spot')).toBe(true);
  });

  it('marketKindFromCoin distingue perp et spot', () => {
    expect(marketKindFromCoin('BTC')).toBe('perp');
    expect(marketKindFromCoin('HYPE')).toBe('perp');
    expect(marketKindFromCoin('PURR/USDC')).toBe('spot');
    expect(marketKindFromCoin('@1')).toBe('spot');
  });

  it('getCandleSnapshot renvoie des bougies BTC taguées perp', async () => {
    const candles = await getCandleSnapshot({
      coin: 'BTC',
      interval: '1h',
      startTime: Date.now() - 6 * 3600 * 1000,
    });
    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe('BTC');
    expect(candles[0]?.kind).toBe('perp');
  });

  it('getCandleSnapshot sur une paire spot tague spot', async () => {
    const candles = await getCandleSnapshot({
      coin: '@1',
      interval: '1h',
      startTime: Date.now() - 6 * 3600 * 1000,
    });
    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]?.kind).toBe('spot');
  });

  it('getOpenOrders renvoie un tableau (adresse zéro)', async () => {
    const orders = await getOpenOrders({
      user: '0x0000000000000000000000000000000000000000',
    });
    expect(Array.isArray(orders)).toBe(true);
  });
});
