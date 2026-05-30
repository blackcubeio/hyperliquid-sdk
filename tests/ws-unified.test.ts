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
});
