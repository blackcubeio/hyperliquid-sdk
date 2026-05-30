import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

const ACCOUNT = readEnv('EVM_PUBLIC_KEY');
const PRIVATE_KEY = readEnv('EVM_PRIVATE_KEY');
const signed =
  ACCOUNT !== undefined &&
  PRIVATE_KEY !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(PRIVATE_KEY) &&
  /[1-9a-f]/i.test(PRIVATE_KEY.slice(2));

describe('Façade Hyperliquid (réel)', () => {
  it('perp().getCandles — public, sans signer', async () => {
    const dex = new Hyperliquid();
    const candles = await dex.perp().getCandles({ name: 'BTC', interval: '1m', limit: 5 });
    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]?.kind).toBe('perp');
    expect(typeof candles[0]?.o).toBe('string');
  }, 20_000);

  it('perp().getPairs — filtre le scope perp', async () => {
    const dex = new Hyperliquid();
    const pairs = await dex.perp().getPairs();
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.every((p) => p.kind === 'perp')).toBe(true);
  }, 20_000);

  it('spot().getPairs — filtre le scope spot', async () => {
    const dex = new Hyperliquid();
    const pairs = await dex.spot().getPairs();
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.every((p) => p.kind === 'spot')).toBe(true);
  }, 20_000);

  it('deux instances Hyperliquid parallèles ne partagent aucun état global', async () => {
    const a = new Hyperliquid();
    const b = new Hyperliquid();
    const [pa, pb] = await Promise.all([a.perp().getPrices(), b.perp().getPrices()]);
    expect(pa.length).toBeGreaterThan(0);
    expect(pb.length).toBeGreaterThan(0);
    expect(pa[0]?.kind).toBe('perp');
    expect(pb[0]?.kind).toBe('perp');
  }, 25_000);

  it('helpers() — EVM (keyTypeOf / privateKeyToAddress / toChecksumAddress)', () => {
    const dex = new Hyperliquid();
    const h = dex.helpers();
    expect(h.keyTypeOf('0xabc')).toBe('evm');
    const addr = h.privateKeyToAddress(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    );
    expect(addr.startsWith('0x')).toBe(true);
    expect(h.toChecksumAddress(addr).toLowerCase()).toBe(addr.toLowerCase());
  });

  it.skipIf(!signed)(
    'account().getBalances — signé testnet',
    async () => {
      const dex = new Hyperliquid(
        {
          deskA: {
            privateKey: PRIVATE_KEY as `0x${string}`,
            publicKey: ACCOUNT as `0x${string}`,
            network: 'testnet',
          },
        },
        { default: 'deskA' },
      );
      const balances = await dex.account().getBalances();
      expect(Array.isArray(balances)).toBe(true);
    },
    20_000,
  );

  it('ws perp subscribeCandles — lazy connect / auto-unsubscribe', async () => {
    const dex = new Hyperliquid();
    const candle = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout ws candles')), 20_000);
      const off = dex.ws().subscribeCandles({ name: 'BTC', interval: '1m' }, (c) => {
        clearTimeout(timer);
        off();
        resolve(c as unknown as Record<string, unknown>);
      });
    });
    expect(candle.s).toBe('BTC');
    expect(candle.kind).toBe('perp');
  }, 25_000);
});
