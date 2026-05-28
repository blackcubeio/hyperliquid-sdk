import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface AssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface Meta {
  universe: AssetMeta[];
  marginTables?: unknown[];
}

/**
 * Métadonnées des perpetuals (univers d'actifs : nom, `szDecimals`, levier max…).
 * L'index dans `universe` est l'asset ID utilisé pour les ordres (BTC = 0 sur mainnet).
 */
export function getMeta(dex?: string, label?: string): Promise<Meta> {
  const body: Record<string, JsonValue> = { type: 'meta' };
  if (dex !== undefined) {
    body.dex = dex;
  }
  return infoRequest<Meta>(body, label);
}
