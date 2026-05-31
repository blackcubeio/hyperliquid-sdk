import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

// Validation des capacités **signées** du namespace `native` sur **testnet réel** (politique : on
// valide toujours les capacités signées). On exerce le chemin signé d'`advancedOrders` :
// placeBatch (ordre ALO loin du marché, ne fill pas) → query (lecture signée) → cancelMany.
const account = readEnv('EVM_PUBLIC_KEY');
const privateKey = readEnv('EVM_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

describe.skipIf(!ready)('Hyperliquid native — capacités signées (testnet réel)', () => {
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

  it('native.account() : lectures par adresse (fees/role/rateLimit/portfolio/historicalOrders)', async () => {
    const acc = dex.native.account();
    const [fees, role, rateLimit, portfolio, hist] = await Promise.all([
      acc.fees(),
      acc.role(),
      acc.rateLimit(),
      acc.portfolio(),
      acc.historicalOrders(),
    ]);
    expect(fees).toBeDefined();
    expect(role).toBeDefined();
    expect(rateLimit).toBeDefined();
    expect(portfolio).toBeDefined();
    expect(Array.isArray(hist)).toBe(true);
  });

  it('native.advancedOrders() : placeBatch → query → cancelMany', async () => {
    // Index d'actif BTC (perp) via la meta native.
    const [meta] = (await dex.native.marketData().metaAndAssetCtxs()) as [
      { universe: Array<{ name: string }> },
      unknown,
    ];
    const asset = meta.universe.findIndex((a) => a.name === 'BTC');
    expect(asset).toBeGreaterThanOrEqual(0);

    const prices = await dex.perp().getPrices();
    const mark = Number(prices.find((p) => p.name === 'BTC')?.mid ?? '0');
    const price = String(Math.max(1, Math.round(mark * 0.5)));

    const res = (await dex.native
      .advancedOrders()
      .placeBatch([{ asset, isBuy: true, price, size: '0.001', tif: 'Alo' }])) as {
      response?: { data?: { statuses?: Array<{ resting?: { oid: number } }> } };
    };
    const oid = res.response?.data?.statuses?.[0]?.resting?.oid;
    console.log('placeBatch resting oid:', oid);
    expect(typeof oid).toBe('number');

    // Lecture signée : statut de l'ordre reposé.
    const status = await dex.native.advancedOrders().query({
      user: account as `0x${string}`,
      oid: oid as number,
    });
    expect(status).toBeDefined();

    // Annulation par lot.
    const cancel = await dex.native.advancedOrders().cancelMany([{ asset, oid: oid as number }]);
    expect(cancel).toBeDefined();
  }, 30_000);
});
