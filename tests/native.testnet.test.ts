import { describe, expect, it } from 'vitest';
import { Hyperliquid } from '../src/dex/hyperliquid';
import { readEnv } from './_env';

// Validation des capacités **signées** sur **testnet réel** (politique : on valide toujours les
// capacités signées). Le surplus ordres est porté par `perp()`/`spot()` : on exerce le chemin signé
// placeBatch (ordre ALO loin du marché, ne fill pas) → getById (lecture signée) → cancelMany.
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
      acc.getFees(),
      acc.getRole(),
      acc.getRateLimit(),
      acc.getPortfolio(),
      acc.getHistoricalOrders(),
    ]);
    expect(fees).toBeDefined();
    expect(role).toBeDefined();
    expect(rateLimit).toBeDefined();
    expect(portfolio).toBeDefined();
    expect(Array.isArray(hist)).toBe(true);
  });

  it('transfers().transfer() : perp↔spot signé réel sur testnet (commun unifié)', async () => {
    // Transfert unifié `transfers().transfer({from,to})` → route vers usdClassTransfer (perp↔spot).
    // Compte testnet en mode **unifié** → rejet **métier** « Action disabled when unified account is
    // active » (signature acceptée). On valide : succès OU erreur métier, jamais une erreur de sig.
    try {
      const res = await dex
        .transfers()
        .transfer({ from: { wallet: 'perp' }, to: { wallet: 'spot' }, amount: '1' });
      expect(res).toBeDefined();
      await dex
        .transfers()
        .transfer({ from: { wallet: 'spot' }, to: { wallet: 'perp' }, amount: '1' });
      console.log('transfer perp↔spot aller-retour OK');
    } catch (e) {
      const msg = String((e as Error).message);
      console.log('transfer rejet métier (signature acceptée):', msg);
      expect(msg).not.toMatch(/signature|does not exist|deserialize|parse/i);
      expect(msg).toMatch(/unified account|insufficient|disabled/i);
    }
  }, 30_000);

  it('native.subAccounts().getList() + transfers() USDC aller-retour si un sous-compte existe', async () => {
    // getList normalisé → SubAccount[] (type commun) : `address` = adresse du sous-compte, `[]` si aucun.
    const subs = await dex.native.subAccounts().getList();
    console.log('sous-comptes:', JSON.stringify(subs));
    const sub = subs[0]?.address as `0x${string}` | undefined;
    if (sub === undefined) {
      console.log(
        'aucun sous-compte testnet → transfert non exécuté (création testée manuellement)',
      );
      return;
    }
    // Transfert réel master → sous-compte puis retour (laisse le solde inchangé), via transfers() commun.
    const into = await dex.transfers().transfer({ to: { subAccount: sub }, amount: '1' });
    expect(into).toBeDefined();
    const back = await dex
      .transfers()
      .transfer({ from: { subAccount: sub }, to: { wallet: 'perp' }, amount: '1' });
    expect(back).toBeDefined();
    console.log('transfert sous-compte aller-retour OK sur', sub);
  }, 30_000);

  it('native.vaults() : equities() réel + chemin signé transfer (sans dépôt réel)', async () => {
    const eq = await dex.native.vaults().getEquities();
    expect(eq).toBeDefined();
    // Chemin signé : un dépôt vault vers une adresse non-vault → rejet métier (signature acceptée).
    // create/modify/distribute (lockup 100 USD / possession requise) sont testés manuellement.
    try {
      const res = await dex.native
        .vaults()
        .transfer({ vaultAddress: account as `0x${string}`, isDeposit: true, usd: '1' });
      expect(res).toBeDefined();
      console.log('vault transfer accepté');
    } catch (e) {
      const msg = String((e as Error).message);
      console.log('vault transfer rejet métier (signature acceptée):', msg);
      // Vault cible inexistant = rejet métier ; on exclut seulement une vraie erreur de signature.
      expect(msg).not.toMatch(/invalid signature|must deserialize|failed to deserialize/i);
    }
  }, 30_000);

  it('native.staking() : lectures réelles + chemin signé withdraw (sans lockup)', async () => {
    const st = dex.native.staking();
    const [del, sum, hist, rew] = await Promise.all([
      st.getDelegations(),
      st.getSummary(),
      st.getHistory(),
      st.getRewards(),
    ]);
    expect(del).toBeDefined();
    expect(sum).toBeDefined();
    expect(hist).toBeDefined();
    expect(rew).toBeDefined();

    // Écriture signée non bloquante : withdraw d'un montant minuscule. Si rien n'est staké, le
    // serveur renvoie un rejet **métier** (signature acceptée) → valide le chemin sans lockup.
    // `deposit`/`delegate` (lockup 7 j) sont préparés + documentés et testés manuellement.
    try {
      const res = await st.withdraw({ amount: '0.00000001' });
      expect(res).toBeDefined();
      console.log('staking withdraw accepté');
    } catch (e) {
      const msg = String((e as Error).message);
      console.log('staking withdraw rejet métier (signature acceptée):', msg);
      expect(msg).not.toMatch(/signature|does not exist|deserialize|parse/i);
    }
  }, 30_000);

  it('perp().placeTwap() : place → cancel (réel) + referral.getInfo() + builders.getMaxFee()', async () => {
    // TWAP réel de taille minime sur 5 min, annulé immédiatement (slices toutes les 30 s → ~0 fill).
    // I/O normalisés : entrée vocab commun (name/side), sortie TwapPlacement (id du TWAP).
    const twap = await dex.native
      .perp()
      .placeTwap({ name: 'BTC', side: 'buy', size: '0.001', minutes: 5 });
    console.log('twap place:', JSON.stringify(twap));
    if (twap.id !== null) {
      const cancel = await dex.native.perp().cancelTwap({ name: 'BTC', id: twap.id });
      expect(cancel.ok).toBeDefined();
      console.log('twap place→cancel OK, twapId', twap.id);
    }

    // Lectures réelles.
    expect(await dex.native.referral().getInfo()).toBeDefined();
    expect(
      await dex.native
        .builders()
        .getMaxFee({ user: account as `0x${string}`, builder: account as `0x${string}` }),
    ).toBeDefined();
    // `referral.set` (one-shot) et `builders.approve` (persistant) sont testés manuellement.
  }, 30_000);

  it('perp() surplus ordres : placeBatch → getById → cancelMany', async () => {
    const prices = await dex.perp().getPrices();
    const mark = Number(prices.find((p) => p.name === 'BTC')?.mid ?? '0');
    const price = String(Math.max(1, Math.round(mark * 0.5)));

    // placeBatch normalisé : entrée vocab commun, sortie Order[] (type commun).
    const orders = await dex.native
      .perp()
      .placeBatch([{ name: 'BTC', side: 'buy', type: 'limit', price, size: '0.001', tif: 'alo' }]);
    const order = orders[0];
    console.log('placeBatch order:', JSON.stringify(order));
    expect(order?.name).toBe('BTC');
    expect(order?.side).toBe('buy');
    expect(order?.id).not.toBe('');

    // getById normalisé → Order (type commun).
    const found = await dex.native.perp().getById({ name: 'BTC', id: order?.id ?? '' });
    expect(found.name).toBe('BTC');
    expect(found.id).toBe(order?.id);

    // Annulation par lot normalisée : entrée vocab commun (name/id), sortie CancelResult[].
    const cancel = await dex.native.perp().cancelMany([{ name: 'BTC', id: order?.id ?? '' }]);
    expect(cancel[0]?.id).toBe(order?.id);
    expect(cancel[0]?.status).toBeDefined();
  }, 30_000);
});
