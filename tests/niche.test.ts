import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { buildCancelByCloidAction } from '../src/rest/exchange/cancel-by-cloid';
import { buildUsdClassTransferAction } from '../src/rest/exchange/usd-class-transfer';
import { getFrontendOpenOrders } from '../src/rest/info/get-frontend-open-orders';
import { getFundingHistory } from '../src/rest/info/get-funding-history';
import { getOrderStatus } from '../src/rest/info/get-order-status';

const ZERO = '0x0000000000000000000000000000000000000000' as const;

describe('actions de niche (formes)', () => {
  it('buildCancelByCloidAction', () => {
    expect(
      buildCancelByCloidAction([{ asset: 0, cloid: '0x00000000000000000000000000000001' }]),
    ).toEqual({
      type: 'cancelByCloid',
      cancels: [{ asset: 0, cloid: '0x00000000000000000000000000000001' }],
    });
  });

  it('buildUsdClassTransferAction', () => {
    expect(buildUsdClassTransferAction({ amount: '50', toPerp: true }, 1234567890)).toEqual({
      type: 'usdClassTransfer',
      signatureChainId: '0x66eee',
      amount: '50',
      toPerp: true,
      nonce: 1234567890,
    });
  });
});

describe('lectures de niche (mainnet réel)', () => {
  beforeAll(() => {
    init({ network: 'mainnet' });
  });

  it('getFundingHistory renvoie un historique BTC', async () => {
    const history = await getFundingHistory({
      coin: 'BTC',
      startTime: Date.now() - 24 * 3600 * 1000,
    });
    expect(Array.isArray(history)).toBe(true);
    expect(history[0]?.coin).toBe('BTC');
  });

  it('getOrderStatus renvoie un statut', async () => {
    const result = await getOrderStatus({ user: ZERO, oid: 1 });
    expect(typeof result.status).toBe('string');
  });

  it('getFrontendOpenOrders renvoie un tableau', async () => {
    const orders = await getFrontendOpenOrders({ user: ZERO });
    expect(Array.isArray(orders)).toBe(true);
  });
});
