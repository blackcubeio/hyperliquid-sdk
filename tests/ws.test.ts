import { describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { WsClient } from '../src/ws/client';

// WebSocket réel sur le mainnet (flux public, pas de wallet requis).
// Couche interne : on passe un client isolé au WsClient (plus de singleton).
const client = init();

describe('WebSocket (mainnet réel)', () => {
  it('reçoit un message allMids', async () => {
    const ws = new WsClient(client);
    await ws.connect();
    try {
      const data = await new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout allMids')), 10_000);
        ws.subscribeAllMids((received) => {
          clearTimeout(timer);
          resolve(received);
        });
      });
      expect(data).toBeTruthy();
    } finally {
      ws.disconnect();
    }
  }, 15_000);
});
