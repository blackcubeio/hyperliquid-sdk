import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Taux de funding prédits par venue pour chaque actif. */
export function getPredictedFundings(client: HyperliquidClient, label?: string): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'predictedFundings' }, label);
}
