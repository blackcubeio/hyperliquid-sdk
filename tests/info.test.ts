import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { getAllMids } from '../src/rest/info/get-all-mids';
import { getL2Book } from '../src/rest/info/get-l2-book';
import { getMeta } from '../src/rest/info/get-meta';

// Lectures /info réelles sur le mainnet (non signées, publiques — pas de wallet requis).
describe('info (mainnet réel)', () => {
  beforeAll(() => {
    init();
  });

  it('getAllMids renvoie un prix pour BTC', async () => {
    const mids = await getAllMids();
    expect(typeof mids.BTC).toBe('string');
    expect(Number(mids.BTC)).toBeGreaterThan(0);
  });

  it('getMeta renvoie un univers avec BTC en index 0', async () => {
    const meta = await getMeta();
    expect(Array.isArray(meta.universe)).toBe(true);
    expect(meta.universe[0]?.name).toBe('BTC');
  });

  it('getL2Book renvoie des bids et asks pour BTC', async () => {
    const book = await getL2Book({ coin: 'BTC' });
    expect(book.coin).toBe('BTC');
    expect(book.levels[0].length).toBeGreaterThan(0);
    expect(book.levels[1].length).toBeGreaterThan(0);
  });
});
