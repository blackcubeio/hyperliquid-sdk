import type { HyperliquidClient } from '../../common/config';
import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/** Historique des paiements de funding d'un compte (par période). */
export function getUserFunding(
  client: HyperliquidClient,
  params: { user: `0x${string}`; startTime: number; endTime?: number },
  label?: string,
): Promise<unknown> {
  const body: Record<string, JsonValue> = {
    type: 'userFunding',
    user: params.user,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    body.endTime = params.endTime;
  }
  return infoRequest<unknown>(client, body, label);
}
