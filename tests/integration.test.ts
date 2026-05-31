import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

// Cycle d'écriture réel sur testnet via la classe. Skippé tant que .env n'a pas de clé valide.
const account = readEnv('EVM_PUBLIC_KEY');
const privateKey = readEnv('EVM_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

describe.skipIf(!ready)('intégration testnet réel (classe Hyperliquid)', () => {
  const dex = new Hyperliquid(
    {
      trader: {
        privateKey: privateKey as `0x${string}`,
        publicKey: account as `0x${string}`,
        network: 'testnet',
      },
    },
    { default: 'trader' },
  );

  it('place un ordre ALO loin du marché puis l’annule', async () => {
    const prices = await dex.perp().getPrices();
    const mark = Number(prices.find((p) => p.name === 'BTC')?.mid ?? '0');
    const price = String(Math.max(1, Math.round(mark * 0.5)));
    const cloid = `0x${globalThis.crypto.randomUUID().replace(/-/g, '')}` as `0x${string}`;

    const order = await dex.perp().place({
      name: 'BTC',
      side: 'buy',
      type: 'limit',
      tif: 'alo',
      size: '0.001',
      price,
      clientId: cloid,
    });
    expect(order.name).toBe('BTC');
    expect(order.kind).toBe('perp');
    expect(order.clientId).toBe(cloid);
    expect(typeof order.id).toBe('string');

    await dex.perp().cancel({ name: 'BTC', id: order.id });
  }, 30_000);
});
