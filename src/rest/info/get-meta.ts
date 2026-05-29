import type { JsonValue, MarketKind } from '../../common/types';
import { infoRequest } from '../client';

export interface AssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
  /** Toujours `'perp'` ici — distingue des paires spot lors d'une fusion. */
  kind: MarketKind;
}

export interface Meta {
  universe: AssetMeta[];
  marginTables?: unknown[];
}

type MetaWire = { universe: Omit<AssetMeta, 'kind'>[]; marginTables?: unknown[] };

/** Tague chaque actif de l'univers perp avec `kind: 'perp'`. */
export function tagPerpMeta(meta: MetaWire): Meta {
  return { ...meta, universe: meta.universe.map((asset) => ({ ...asset, kind: 'perp' as const })) };
}

/**
 * Métadonnées des perpetuals (univers d'actifs : nom, `szDecimals`, levier max…).
 * L'index dans `universe` est l'asset ID utilisé pour les ordres (BTC = 0 sur mainnet).
 * Chaque actif porte `kind: 'perp'`.
 */
export function getMeta(dex?: string, label?: string): Promise<Meta> {
  const body: Record<string, JsonValue> = { type: 'meta' };
  if (dex !== undefined) {
    body.dex = dex;
  }
  return infoRequest<MetaWire>(body, label).then(tagPerpMeta);
}
