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

  it('native.transfers() : usdClassTransfer (transfert signé réel sur testnet)', async () => {
    // Vrai appel signé de transfert sur testnet. Le compte testnet est en mode **unifié**
    // (perp/spot non séparés) → le serveur renvoie « Action disabled when unified account is
    // active » : c'est un rejet **métier** (la signature a été acceptée et l'action traitée), pas
    // une erreur de signature. On valide donc : succès OU erreur métier, jamais une erreur de sig.
    try {
      const res = await dex.native.transfers().usdClassTransfer({ amount: '1', toPerp: false });
      expect(res).toBeDefined();
      await dex.native.transfers().usdClassTransfer({ amount: '1', toPerp: true }); // retour
      console.log('usdClassTransfer aller-retour OK');
    } catch (e) {
      const msg = String((e as Error).message);
      console.log('usdClassTransfer rejet métier (signature acceptée):', msg);
      expect(msg).not.toMatch(/signature|does not exist|deserialize|parse/i);
      expect(msg).toMatch(/unified account|insufficient|disabled/i);
    }
  }, 30_000);

  it('native.subAccounts() : list() + transfert USDC aller-retour si un sous-compte existe', async () => {
    // HL renvoie `null` si le master n'a aucun sous-compte, sinon un tableau.
    const subs = (await dex.native.subAccounts().list()) as Array<{
      subAccountUser?: string;
    }> | null;
    console.log('sous-comptes:', JSON.stringify(subs));
    const sub = (Array.isArray(subs) ? subs[0]?.subAccountUser : undefined) as
      | `0x${string}`
      | undefined;
    if (sub === undefined) {
      console.log(
        'aucun sous-compte testnet → transfert non exécuté (création testée manuellement)',
      );
      return;
    }
    // Transfert réel master → sous-compte puis retour (laisse le solde inchangé).
    const into = await dex.native
      .subAccounts()
      .transfer({ subAccountUser: sub, isDeposit: true, usd: '1' });
    expect(into).toBeDefined();
    const back = await dex.native
      .subAccounts()
      .transfer({ subAccountUser: sub, isDeposit: false, usd: '1' });
    expect(back).toBeDefined();
    console.log('transfert sous-compte aller-retour OK sur', sub);
  }, 30_000);

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
