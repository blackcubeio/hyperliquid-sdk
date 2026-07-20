import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

// VRAI test testnet (pas de mock) : le fix `markPrice` sur les positions. HL fournit `unrealizedPnl` mais pas le
// mark dans le wire clearinghouse → la façade le complète depuis `getPrices`. On l'exerce sur une position RÉELLE :
// ouvrir un market → getPositions → asserter markPrice ET unrealizedPnl non-null → fermer (cleanup inconditionnel).
const account = readEnv('EVM_PUBLIC_KEY');
const privateKey = readEnv('EVM_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

describe.skipIf(!ready)('Hyperliquid getPositions — markPrice rempli (testnet réel)', () => {
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

  it('open market → getPositions renseigne markPrice + unrealizedPnl → close', async () => {
    const perp = dex.perp('trader');
    const symbol = 'ETH';
    const pair = (await perp.getPairs()).find((p) => p.name === symbol);
    const mark = Number((await perp.getPrices()).find((p) => p.name === symbol)?.mark);
    if (pair === undefined || Number.isFinite(mark) === false || mark <= 0) {
      throw new Error('pas de marché ETH testnet exploitable');
    }
    const step = String(pair.stepSize ?? '0.0001');
    const dec = (value: string): number => (value.split('.')[1] ?? '').length;
    const size = (Math.ceil(15 / mark / Number(step)) * Number(step)).toFixed(dec(step));

    const openAt = (side: 'buy' | 'sell', reduceOnly: boolean, sz: string) =>
      perp.place({
        name: symbol,
        side,
        type: 'market',
        size: sz,
        slippagePercent: '5',
        reduceOnly,
      });

    await openAt('buy', false, size);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const pos = (await perp.getPositions({ name: symbol })).find(
        (p) => p.name === symbol && Math.abs(Number(p.size)) > 0,
      );
      expect(pos).toBeDefined();
      expect(pos?.markPrice).not.toBeNull(); // LE FIX : mark complété depuis getPrices
      expect(Number(pos?.markPrice)).toBeGreaterThan(0);
      expect(pos?.unrealizedPnl).not.toBeNull(); // uPnl fourni par HL
    } finally {
      const pos = (await perp.getPositions({ name: symbol })).find(
        (p) => p.name === symbol && Math.abs(Number(p.size)) > 0,
      );
      if (pos !== undefined) {
        await openAt('sell', true, String(Math.abs(Number(pos.size))));
      }
    }
  }, 30_000);
});
