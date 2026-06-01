import { describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import type { WebSocketLike } from '../src/common/config';
import { WsClient } from '../src/ws/client';

/**
 * Robustesse WS sur le mainnet réel (flux public, sans wallet) : reconnexion + re-subscribe
 * effectifs, rejet des `post` en vol au close. On injecte une fabrique de socket qui **wrappe**
 * le vrai WebSocket pour pouvoir le fermer de force et observer la reprise. Aucun mock réseau :
 * la socket sous-jacente est une vraie connexion HL.
 */

// Fabrique : vrai WebSocket Node, mais on garde une réf pour pouvoir le fermer brutalement.
const sockets: WebSocketLike[] = [];
function trackingFactory(url: string): WebSocketLike {
  const socket = new globalThis.WebSocket(url) as unknown as WebSocketLike;
  sockets.push(socket);
  return socket;
}

const baseClient = init();
const client = { ...baseClient, webSocket: trackingFactory };

describe('WsClient robustesse (mainnet réel, public)', () => {
  it('reconnecte et re-souscrit après une coupure forcée (messages reprennent)', async () => {
    sockets.length = 0;
    const ws = new WsClient(client);
    let reconnected = false;
    ws.onReconnect = () => {
      reconnected = true;
    };
    await ws.connect();
    try {
      // 1er message : confirme le flux initial.
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout flux initial')), 15_000);
        ws.subscribeAllMids(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      const socketsBefore = sockets.length;
      // Coupure brutale : ferme la socket sous-jacente → handleClose → scheduleReconnect.
      sockets[sockets.length - 1]?.close();
      // Les messages doivent reprendre sur la NOUVELLE socket (re-subscribe automatique).
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('timeout reprise après reconnect')),
          20_000,
        );
        // Nouveau handler : si on reçoit, c'est que la re-souscription a fonctionné.
        ws.subscribeAllMids(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      expect(sockets.length).toBeGreaterThan(socketsBefore); // une nouvelle socket a bien été créée
      expect(reconnected).toBe(true); // onReconnect a été notifié
    } finally {
      ws.disconnect();
    }
  }, 45_000);

  it('rejette les `post` en vol quand la socket se ferme (pas de hang)', async () => {
    sockets.length = 0;
    const ws = new WsClient(client);
    await ws.connect();
    try {
      // post() sans réponse attendue immédiate : on ferme la socket → la promesse doit REJETER.
      const pending = ws.post({ type: 'info', payload: { type: 'meta' } });
      // Ferme tout de suite après l'émission.
      sockets[sockets.length - 1]?.close();
      await expect(pending).rejects.toThrow(/requête en vol annulée|délai dépassé/);
    } finally {
      ws.disconnect();
    }
  }, 30_000);

  it('disconnect() ne reconnecte pas (shouldReconnect=false)', async () => {
    sockets.length = 0;
    const ws = new WsClient(client);
    await ws.connect();
    const countAfterConnect = sockets.length;
    ws.disconnect();
    // Laisse passer le temps qu'un éventuel backoff aurait tenté une reconnexion.
    await new Promise((r) => setTimeout(r, 2_000));
    expect(sockets.length).toBe(countAfterConnect); // aucune nouvelle socket
  }, 15_000);
});
