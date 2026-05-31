import { describe, expect, it } from 'vitest';
import type { Order, UserTrade } from '../src/common/types';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

const account = readEnv('EVM_PUBLIC_KEY');
const privateKey = readEnv('EVM_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

function dex(): Hyperliquid {
  return new Hyperliquid(
    {
      trader: {
        privateKey: privateKey as `0x${string}`,
        publicKey: account as `0x${string}`,
        network: 'testnet',
      },
    },
    { default: 'trader' },
  );
}

// Flux user-data unifiés sur le testnet réel (ALO far-from-market, annulé après), via la classe.
describe.skipIf(!ready)('Hyperliquid.ws() user-data (testnet réel)', () => {
  it('subscribeOrders délivre un Order unifié quand un ordre est placé', async () => {
    const hl = dex();
    const prices = await hl.perp().getPrices();
    const mark = Number(prices.find((p) => p.name === 'BTC')?.mid ?? '0');
    const price = String(Math.max(1, Math.round(mark * 0.5)));
    const cloid = `0x${globalThis.crypto.randomUUID().replace(/-/g, '')}` as `0x${string}`;
    const orders: Order[] = [];
    const off = hl.ws().subscribeOrders((order) => orders.push(order));
    try {
      await new Promise((r) => setTimeout(r, 1500));
      await hl.perp().place({
        name: 'BTC',
        side: 'buy',
        type: 'limit',
        tif: 'alo',
        size: '0.001',
        price,
        clientId: cloid,
      });
      const order = await waitFor(orders, (o) => o.clientId === cloid, 20_000);
      expect(order.name).toBe('BTC');
      expect(order.kind).toBe('perp');
      expect(order.side).toBe('buy');
      expect(order.type).toBe('limit');
      expect(typeof order.id).toBe('string');
      expect(typeof order.price).toBe('string');
      await hl
        .perp()
        .cancel({ name: 'BTC', id: order.id })
        .catch(() => {});
    } finally {
      off();
    }
  }, 40_000);

  it('subscribeUserTrades délivre un UserTrade unifié sur un fill', async () => {
    const hl = dex();
    const prices = await hl.perp().getPrices();
    const mark = Number(prices.find((p) => p.name === 'BTC')?.mid ?? '0');
    const fills: UserTrade[] = [];
    const off = hl.ws().subscribeUserTrades((t) => fills.push(t));
    try {
      await new Promise((r) => setTimeout(r, 1500));
      await hl.perp().place({
        name: 'BTC',
        side: 'buy',
        type: 'market',
        size: '0.001',
        price: String(Math.round(mark * 1.03)),
      });
      const fill = await waitFor(fills, (t) => t.name === 'BTC' && Number(t.time) > 0, 20_000);
      expect(fill.kind).toBe('perp');
      expect(typeof fill.id).toBe('string');
      expect(typeof fill.orderId).toBe('string');
      expect(['buy', 'sell']).toContain(fill.side);
      expect(typeof fill.price).toBe('string');
      expect(typeof fill.fee).toBe('string');
      expect(typeof fill.maker).toBe('boolean');
    } finally {
      await hl
        .perp()
        .place({
          name: 'BTC',
          side: 'sell',
          type: 'market',
          size: '0.001',
          price: String(Math.round(mark * 0.97)),
          reduceOnly: true,
        })
        .catch(() => {});
      off();
    }
  }, 45_000);
});

function waitFor<T>(bucket: T[], pred: (x: T) => boolean, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = setInterval(() => {
      const found = bucket.find(pred);
      if (found !== undefined) {
        clearInterval(tick);
        resolve(found);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(tick);
        reject(new Error('timeout waitFor'));
      }
    }, 500);
  });
}
