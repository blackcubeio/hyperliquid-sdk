import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { UnifiedWsClient } from '../src/ws/unified-client';

// Flux WS unifiés sur le mainnet réel (public, sans wallet).
describe('UnifiedWsClient HL (mainnet réel, public)', () => {
  beforeAll(() => init());

  it(
    'subscribeCandles délivre une Candle unifiée',
    async () => {
      const client = new UnifiedWsClient();
      await client.connect();
      try {
        const candle = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout candles')), 25_000);
          client.subscribeCandles({ name: 'BTC', interval: '1m' }, (received) => {
            clearTimeout(timer);
            resolve(received as unknown as Record<string, unknown>);
          });
        });
        // Cœur unifié présent et typé.
        expect(candle.s).toBe('BTC');
        expect(candle.i).toBe('1m');
        expect(candle.kind).toBe('perp');
        expect(typeof candle.t).toBe('number');
        expect(typeof candle.o).toBe('string');
        expect(candle.qv).toBeNull();
        expect(candle.tbbv).toBeNull();
      } finally {
        client.disconnect();
      }
    },
    30_000,
  );

  it(
    'subscribeTrades délivre un Trade unifié par trade',
    async () => {
      const client = new UnifiedWsClient();
      await client.connect();
      try {
        const trade = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout trades')), 25_000);
          client.subscribeTrades({ name: 'BTC' }, (received) => {
            clearTimeout(timer);
            resolve(received as unknown as Record<string, unknown>);
          });
        });
        expect(typeof trade.price).toBe('string');
        expect(typeof trade.size).toBe('string');
        expect(['buy', 'sell']).toContain(trade.side);
        expect(trade.maker).toBeNull();
        expect(typeof trade.time).toBe('number');
        expect(typeof trade.id).toBe('number');
      } finally {
        client.disconnect();
      }
    },
    30_000,
  );

  it(
    'subscribeBbo délivre un OrderBook (1 niveau par côté)',
    async () => {
      const client = new UnifiedWsClient();
      await client.connect();
      try {
        const book = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout bbo')), 25_000);
          client.subscribeBbo({ name: 'BTC' }, (received) => {
            clearTimeout(timer);
            resolve(received as unknown as Record<string, unknown>);
          });
        });
        expect(book.name).toBe('BTC');
        expect(book.kind).toBe('perp');
        const bids = book.bids as Array<{ price: string; n: number | null }>;
        const asks = book.asks as Array<{ price: string }>;
        expect(typeof bids[0].price).toBe('string');
        expect(typeof asks[0].price).toBe('string');
        expect(typeof bids[0].n).toBe('number');
      } finally {
        client.disconnect();
      }
    },
    30_000,
  );
});
