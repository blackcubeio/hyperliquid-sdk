import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import { assetIndex } from '../src/common/utils';
import { cancelOrdersByCloid } from '../src/rest/exchange/cancel-by-cloid';
import { createLimitOrder } from '../src/rest/exchange/place-order';
import { getAllMids } from '../src/rest/info/get-all-mids';
import { getMeta } from '../src/rest/info/get-meta';
import { readEnv } from './_env';

// Cycle d'écriture réel sur testnet. Skippé tant que .env n'a pas de clé d'agent valide.
const account = readEnv('HYPERLIQUID_ACCOUNT_ADDRESS');
const privateKey = readEnv('HYPERLIQUID_AGENT_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

describe.skipIf(!ready)('intégration testnet réel', () => {
  beforeAll(() => {
    init({
      network: 'testnet',
      signers: { [account as string]: { privateKey: privateKey as `0x${string}` } },
    });
  });
  afterAll(() => {
    resetConfig();
  });

  it('place un ordre ALO loin du marché puis l’annule par cloid', async () => {
    const meta = await getMeta();
    const asset = assetIndex(meta.universe, 'BTC');
    const mids = await getAllMids();
    const price = Math.max(1, Math.round(Number(mids.BTC) * 0.5));
    const cloid = `0x${globalThis.crypto.randomUUID().replace(/-/g, '')}` as `0x${string}`;

    const placed = await createLimitOrder<{ status: string }>({
      asset,
      isBuy: true,
      price,
      size: 0.001,
      tif: 'Alo',
      cloid,
    });
    expect(placed.status).toBe('ok');

    const cancelled = await cancelOrdersByCloid<{ status: string }>([{ asset, cloid }]);
    expect(cancelled.status).toBe('ok');
  }, 30_000);
});
