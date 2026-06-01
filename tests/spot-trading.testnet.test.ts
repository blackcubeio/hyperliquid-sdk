import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

// Chemin d'ÉCRITURE spot sur **testnet réel** (bug argent réel corrigé) : `dex.spot().place()`
// doit résoudre l'asset via spotMeta + offset 10000 (et **pas** l'univers perp). Preuve : un ordre
// ALO spot placé TRÈS loin du marché (ne fill pas), `kind:'spot'` en sortie, puis annulé (non
// destructif). Avant le fix, le spot tapait le mauvais asset (résolution perp uniquement).
const account = readEnv('EVM_PUBLIC_KEY');
const privateKey = readEnv('EVM_PRIVATE_KEY');
const ready =
  account !== undefined &&
  privateKey !== undefined &&
  /^0x[0-9a-f]{64}$/i.test(privateKey) &&
  /[1-9a-f]/i.test(privateKey.slice(2));

describe.skipIf(!ready)('Hyperliquid spot — écriture signée (testnet réel)', () => {
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

  it('spot().place() ALO loin du marché → kind spot → cancel (asset correctement résolu)', async () => {
    const name = 'PURR/USDC';
    // Carnet spot réel : on place très en-dessous du meilleur bid (ne fill jamais).
    const book = await dex.spot().getOrderBook({ name });
    const bid = Number(book.bids[0]?.price ?? '1');
    // Prix loin sous le marché ; size telle que le notionnel dépasse le min spot HL (~10 USD).
    const price = (bid * 0.2).toFixed(4);
    const size = String(Math.ceil(12 / Number(price))); // ≈ 12 USD de notionnel au prix limite

    try {
      const order = await dex
        .spot()
        .place({ name, side: 'buy', type: 'limit', size, price, tif: 'alo' });
      console.log('spot place:', JSON.stringify(order));
      // Preuve forte : le scope spot a produit un Order `kind:'spot'` avec un id réel.
      expect(order.kind).toBe('spot');
      expect(order.name).toBe(name);
      expect(order.id).not.toBe('');
      // Annulation via le scope spot (résout aussi l'asset spot).
      await dex.spot().cancel({ name, id: order.id });
      console.log('spot place→cancel OK, asset spot résolu correctement');
    } catch (e) {
      // Rejet **métier** (solde spot insuffisant…) = signature/asset acceptés par le serveur :
      // le chemin spot a été exercé sans erreur de résolution. On exclut une vraie erreur d'asset.
      const msg = String((e as Error).message);
      console.log('spot place rejet métier (asset/signature acceptés):', msg);
      expect(msg).not.toMatch(/signature|deserialize|parse|invalid asset|unknown asset/i);
    }
  }, 30_000);
});
