import type { HyperliquidClient } from '../../common/config';
import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/** Mouvements de ledger hors funding (dépôts, retraits, transferts, liquidations…) par période. */
export function getUserNonFundingLedgerUpdates(
  client: HyperliquidClient,
  params: { user: `0x${string}`; startTime: number; endTime?: number },
  label?: string,
): Promise<unknown> {
  const body: Record<string, JsonValue> = {
    type: 'userNonFundingLedgerUpdates',
    user: params.user,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    body.endTime = params.endTime;
  }
  return infoRequest<unknown>(client, body, label);
}
