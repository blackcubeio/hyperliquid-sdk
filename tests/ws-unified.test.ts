import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';

// Flux WS unifiés sur le mainnet réel (public, sans wallet), via la classe Hyperliquid.
// Lazy-connect : le socket s'ouvre au 1er subscribe et se ferme au dernier unsubscribe.
describe('Hyperliquid.ws() (mainnet réel, public)', () => {
  it('subscribeCandles délivre une Candle unifiée', async () => {
    const dex = new Hyperliquid();
    const candle = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout candles')), 25_000);
      const off = dex.ws().subscribeCandles({ name: 'BTC', interval: '1m' }, (received) => {
        clearTimeout(timer);
        off();
        resolve(received as unknown as Record<string, unknown>);
      });
    });
    expect(candle.s).toBe('BTC');
    expect(candle.i).toBe('1m');
    expect(candle.kind).toBe('perp');
    expect(typeof candle.t).toBe('number');
    expect(typeof candle.o).toBe('string');
    expect(candle.qv).toBeNull();
    expect(candle.tbbv).toBeNull();
  }, 30_000);

  it('subscribeTrades délivre un Trade unifié par trade', async () => {
    const dex = new Hyperliquid();
    const trade = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout trades')), 25_000);
      const off = dex.ws().subscribeTrades({ name: 'BTC' }, (received) => {
        clearTimeout(timer);
        off();
        resolve(received as unknown as Record<string, unknown>);
      });
    });
    expect(typeof trade.price).toBe('string');
    expect(typeof trade.size).toBe('string');
    expect(['buy', 'sell']).toContain(trade.side);
    expect(trade.maker).toBeNull();
    expect(typeof trade.time).toBe('number');
    expect(typeof trade.id).toBe('number');
  }, 30_000);

  it('subscribeBbo délivre un OrderBook (1 niveau par côté)', async () => {
    const dex = new Hyperliquid();
    const book = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout bbo')), 25_000);
      const off = dex.ws().subscribeBbo({ name: 'BTC' }, (received) => {
        clearTimeout(timer);
        off();
        resolve(received as unknown as Record<string, unknown>);
      });
    });
    expect(book.name).toBe('BTC');
    expect(book.kind).toBe('perp');
    const bids = book.bids as Array<{ price: string; n: number | null }>;
    const asks = book.asks as Array<{ price: string }>;
    expect(typeof bids[0]?.price).toBe('string');
    expect(typeof asks[0]?.price).toBe('string');
    expect(typeof bids[0]?.n).toBe('number');
  }, 30_000);

  it('subscribeOrderBook délivre un OrderBook (L2)', async () => {
    const dex = new Hyperliquid();
    const book = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout orderbook')), 25_000);
      const off = dex.ws().subscribeOrderBook({ name: 'BTC' }, (received) => {
        clearTimeout(timer);
        off();
        resolve(received as unknown as Record<string, unknown>);
      });
    });
    expect(book.name).toBe('BTC');
    expect(book.kind).toBe('perp');
    const bids = book.bids as Array<{ price: string; size: string }>;
    const asks = book.asks as Array<{ price: string }>;
    expect(bids.length).toBeGreaterThan(0);
    expect(asks.length).toBeGreaterThan(0);
    expect(typeof bids[0]?.price).toBe('string');
    expect(typeof bids[0]?.size).toBe('string');
  }, 30_000);

  it('subscribePrices délivre un Price[] (mid par marché)', async () => {
    const dex = new Hyperliquid();
    const prices = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout prices')), 25_000);
      const off = dex.ws().subscribePrices((received) => {
        clearTimeout(timer);
        off();
        resolve(received as unknown as Array<Record<string, unknown>>);
      });
    });
    expect(prices.length).toBeGreaterThan(0);
    const btc = prices.find((p) => p.name === 'BTC');
    expect(btc).toBeDefined();
    expect(btc?.kind).toBe('perp');
    expect(typeof btc?.mid).toBe('string');
    expect(btc?.mark).toBeNull();
  }, 30_000);
});
