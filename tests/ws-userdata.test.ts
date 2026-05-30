import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import type { Order, UserTrade } from '../src/common/types';
import { assetIndex } from '../src/common/utils';
import { cancelOrdersByCloid } from '../src/rest/exchange/cancel-by-cloid';
import { createLimitOrder, createMarketOrder } from '../src/rest/exchange/place-order';
import { getAllMids } from '../src/rest/info/get-all-mids';
import { getMeta } from '../src/rest/info/get-meta';
import { UnifiedWsClient } from '../src/ws/unified-client';
import { readEnv } from './_env';

const account = readEnv('EVM_PUBLIC_KEY');
const privateKey = readEnv('EVM_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

// Flux user-data unifiés sur le testnet réel (ALO far-from-market, annulé après).
describe.skipIf(!ready)('UnifiedWsClient HL user-data (testnet réel)', () => {
  beforeAll(() => {
    init({
      signers: {
        trader: {
          privateKey: privateKey as `0x${string}`,
          publicKey: account as `0x${string}`,
          network: 'testnet',
        },
      },
    });
  });

  it(
    'subscribeOrders délivre un Order unifié quand un ordre est placé',
    async () => {
      const meta = await getMeta(undefined, 'trader');
      const asset = assetIndex(meta.universe, 'BTC');
      const mids = await getAllMids(undefined, 'trader');
      const price = Math.max(1, Math.round(Number(mids.BTC) * 0.5));
      const cloid = `0x${globalThis.crypto.randomUUID().replace(/-/g, '')}` as `0x${string}`;
      const orders: Order[] = [];
      const client = new UnifiedWsClient({ label: 'trader' });
      await client.connect();
      try {
        client.subscribeOrders({ user: account }, (order) => orders.push(order));
        await new Promise((r) => setTimeout(r, 1500));
        await createLimitOrder(
          { asset, isBuy: true, price, size: 0.001, tif: 'Alo', cloid },
          'trader',
        );
        const order = await waitFor(orders, (o) => o.clientId === cloid, 20_000);
        expect(order.name).toBe('BTC');
        expect(order.kind).toBe('perp');
        expect(order.side).toBe('buy');
        expect(order.type).toBe('limit');
        expect(typeof order.id).toBe('string');
        expect(typeof order.price).toBe('string');
      } finally {
        await cancelOrdersByCloid([{ asset, cloid }], 'trader').catch(() => {});
        client.disconnect();
      }
    },
    40_000,
  );

  it(
    'subscribeUserTrades délivre un UserTrade unifié sur un fill',
    async () => {
      const meta = await getMeta(undefined, 'trader');
      const asset = assetIndex(meta.universe, 'BTC');
      const mids = await getAllMids(undefined, 'trader');
      const mark = Number(mids.BTC);
      const fills: UserTrade[] = [];
      const client = new UnifiedWsClient({ label: 'trader' });
      await client.connect();
      try {
        client.subscribeUserTrades({ user: account }, (t) => fills.push(t));
        await new Promise((r) => setTimeout(r, 1500));
        await createMarketOrder(
          { asset, isBuy: true, price: Math.round(mark * 1.03), size: 0.001 },
          'trader',
        );
        const fill = await waitFor(fills, (t) => t.name === 'BTC' && Number(t.time) > 0, 20_000);
        expect(fill.kind).toBe('perp');
        expect(typeof fill.id).toBe('string');
        expect(typeof fill.orderId).toBe('string');
        expect(['buy', 'sell']).toContain(fill.side);
        expect(typeof fill.price).toBe('string');
        expect(typeof fill.fee).toBe('string');
        expect(typeof fill.maker).toBe('boolean');
      } finally {
        await createMarketOrder(
          { asset, isBuy: false, price: Math.round(mark * 0.97), size: 0.001, reduceOnly: true },
          'trader',
        ).catch(() => {});
        client.disconnect();
      }
    },
    45_000,
  );
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
