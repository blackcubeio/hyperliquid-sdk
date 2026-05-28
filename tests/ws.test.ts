import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { WsClient } from '../src/ws/client';

// WebSocket réel sur le mainnet (flux public, pas de wallet requis).
describe('WebSocket (mainnet réel)', () => {
  beforeAll(() => {
    init({ network: 'mainnet' });
  });

  it('reçoit un message allMids', async () => {
    const client = new WsClient();
    await client.connect();
    try {
      const data = await new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout allMids')), 10_000);
        client.subscribeAllMids((received) => {
          clearTimeout(timer);
          resolve(received);
        });
      });
      expect(data).toBeTruthy();
    } finally {
      client.disconnect();
    }
  }, 15_000);
});
