import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Limites de requêtes d'un compte (volume cumulé, requêtes utilisées/autorisées). */
export function getUserRateLimit(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'userRateLimit', user: params.user }, label);
}
