import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/** Prix mid de toutes les coins, indexés par nom de coin. */
export type AllMids = Record<string, string>;

/**
 * Récupère les prix mid de toutes les coins.
 * @param dex Perp dex (défaut : premier perp dex). Les mids spot ne sont inclus que sur le premier.
 */
export function getAllMids(dex?: string): Promise<AllMids> {
  const body: Record<string, JsonValue> = { type: 'allMids' };
  if (dex !== undefined) {
    body.dex = dex;
  }
  return infoRequest<AllMids>(body);
}
