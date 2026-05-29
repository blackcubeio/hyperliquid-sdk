import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { getOrderBook } from '../src/rest/get-order-book';
import { getAllMids } from '../src/rest/info/get-all-mids';
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
    expect(meta.universe[0]?.kind).toBe('perp');
  });

  it('getOrderBook renvoie le carnet unifié pour BTC', async () => {
    const book = await getOrderBook({ name: 'BTC' });
    expect(book.name).toBe('BTC');
    expect(book.kind).toBe('perp');
    expect(book.bids.length).toBeGreaterThan(0);
    expect(book.asks.length).toBeGreaterThan(0);
    expect(typeof book.bids[0]?.n).toBe('number');
  });
});
