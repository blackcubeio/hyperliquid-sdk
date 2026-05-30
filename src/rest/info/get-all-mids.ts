import type { HyperliquidClient } from '../../common/config';
import type { AllMids } from '../../common/types';
import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/**
 * Récupère les prix mid de toutes les coins.
 * @param dex Perp dex (défaut : premier perp dex). Les mids spot ne sont inclus que sur le premier.
 */
export function getAllMids(
  client: HyperliquidClient,
  dex?: string,
  label?: string,
): Promise<AllMids> {
  const body: Record<string, JsonValue> = { type: 'allMids' };
  if (dex !== undefined) {
    body.dex = dex;
  }
  return infoRequest<AllMids>(client, body, label);
}
