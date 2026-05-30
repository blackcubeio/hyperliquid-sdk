import type { SpotMeta, SpotPair, SpotToken } from '../../common/types';
import type { MarketKind } from '../../common/types';
import { infoRequest } from '../client';

type SpotMetaWire = { tokens: SpotToken[]; universe: Omit<SpotPair, 'kind'>[] };

/** Tague chaque paire de l'univers spot avec `kind: 'spot'`. */
export function tagSpotMeta(meta: SpotMetaWire): SpotMeta {
  return { ...meta, universe: meta.universe.map((pair) => ({ ...pair, kind: 'spot' as const })) };
}

/**
 * Métadonnées du marché spot (tokens + paires). L'asset ID spot d'une paire = `10000 + index`.
 * Chaque paire porte `kind: 'spot'`.
 */
export function getMetaSpot(label?: string): Promise<SpotMeta> {
  return infoRequest<SpotMetaWire>({ type: 'spotMeta' }, label).then(tagSpotMeta);
}
