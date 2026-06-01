import type { HyperliquidClient } from '../../common/config';
import type { MarketKind } from '../../common/types';
import { getMeta } from './get-meta';
import { getMetaSpot } from './get-meta-spot';

/** Offset HL des assets spot : asset ID spot = `10000 + index` de la paire dans `spotMeta.universe`. */
export const SPOT_ASSET_OFFSET = 10_000;

/**
 * Résout l'**asset ID HL** d'un `name` selon le `kind` du scope (point unique pour les écritures).
 *
 * - **perp** : index de la coin dans `meta.universe` (BTC = 0 sur mainnet).
 * - **spot** : `10000 + index` de la paire dans `spotMeta.universe` (offset documenté HL). Le `name`
 *   est l'identifiant de paire (`PURR/USDC` ou `@1`).
 *
 * Sépare proprement la résolution perp/spot : avant ce helper, **toutes** les écritures résolvaient
 * via l'univers perp uniquement (`getMeta` + index) en figeant `kind:'perp'` — le spot tapait donc
 * le **mauvais asset** (bug argent réel). Lève si le `name` est introuvable dans l'univers ciblé.
 */
export function resolveAsset(
  client: HyperliquidClient,
  name: string,
  kind: MarketKind,
  label?: string,
): Promise<number> {
  if (kind === 'spot') {
    return getMetaSpot(client, label).then((meta) => {
      const pair = meta.universe.find((p) => p.name === name);
      if (pair === undefined) {
        throw new Error(`Paire spot introuvable dans l'univers : ${name}`);
      }
      return SPOT_ASSET_OFFSET + pair.index;
    });
  }
  return getMeta(client, undefined, label).then((meta) => {
    const index = meta.universe.findIndex((asset) => asset.name === name);
    if (index === -1) {
      throw new Error(`Coin perp introuvable dans l'univers : ${name}`);
    }
    return index;
  });
}
