import { describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { getMetaSpot } from '../src/rest/info/get-meta-spot';
import { SPOT_ASSET_OFFSET, resolveAsset } from '../src/rest/info/resolve-asset';

// Résolution d'asset HL perp vs spot (lecture mainnet réelle, public, sans wallet).
// Prouve que les chemins spot résolvent l'asset via spotMeta + offset 10000 (et pas l'univers perp).
const client = init();

describe('resolveAsset (mainnet réel, public)', () => {
  it('perp BTC = index 0 (univers meta)', async () => {
    const asset = await resolveAsset(client, 'BTC', 'perp');
    expect(asset).toBe(0);
  }, 20_000);

  it('spot PURR/USDC = 10000 + index de la paire (offset HL)', async () => {
    const meta = await getMetaSpot(client);
    const pair = meta.universe.find((p) => p.name === 'PURR/USDC');
    expect(pair).toBeDefined();
    const asset = await resolveAsset(client, 'PURR/USDC', 'spot');
    expect(asset).toBe(SPOT_ASSET_OFFSET + (pair?.index ?? -1));
    // L'asset spot doit être ≥ 10000 (jamais confondu avec un index perp).
    expect(asset).toBeGreaterThanOrEqual(SPOT_ASSET_OFFSET);
  }, 20_000);

  it("spot et perp d'un même rang ne collisionnent pas", async () => {
    // Le coin perp d'index 0 (BTC) et la 1re paire spot ne doivent jamais avoir le même asset ID.
    const perp0 = await resolveAsset(client, 'BTC', 'perp');
    const spotMeta = await getMetaSpot(client);
    const firstSpot = spotMeta.universe[0];
    expect(firstSpot).toBeDefined();
    const spotAsset = await resolveAsset(client, (firstSpot as { name: string }).name, 'spot');
    expect(spotAsset).not.toBe(perp0);
    expect(spotAsset).toBe(SPOT_ASSET_OFFSET + (firstSpot as { index: number }).index);
  }, 20_000);

  it('paire spot introuvable → erreur explicite (pas de fallback perp silencieux)', async () => {
    await expect(resolveAsset(client, 'NOPE/USDC', 'spot')).rejects.toThrow(
      /Paire spot introuvable/,
    );
  }, 20_000);
});
