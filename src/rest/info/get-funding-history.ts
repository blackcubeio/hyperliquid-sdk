import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface FundingHistoryEntry {
  coin: string;
  fundingRate: string;
  premium: string;
  time: number;
}

/** Historique des taux de funding d'une coin sur une fenêtre temporelle. */
export function getFundingHistory(params: {
  coin: string;
  startTime: number;
  endTime?: number;
}): Promise<FundingHistoryEntry[]> {
  const body: Record<string, JsonValue> = {
    type: 'fundingHistory',
    coin: params.coin,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    body.endTime = params.endTime;
  }
  return infoRequest<FundingHistoryEntry[]>(body);
}
