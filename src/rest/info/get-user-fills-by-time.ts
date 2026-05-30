import type { JsonValue } from '../../common/types';
import type { UserFill } from '../../common/types';
import { infoRequest } from '../client';

/** Fills d'un compte sur une fenêtre temporelle (max 500 par requête ; paginer via le dernier `time`). */
export function getUserFillsByTime(
  params: {
    user: `0x${string}`;
    startTime: number;
    endTime?: number;
    aggregateByTime?: boolean;
  },
  label?: string,
): Promise<UserFill[]> {
  const body: Record<string, JsonValue> = {
    type: 'userFillsByTime',
    user: params.user,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    body.endTime = params.endTime;
  }
  if (params.aggregateByTime !== undefined) {
    body.aggregateByTime = params.aggregateByTime;
  }
  return infoRequest<UserFill[]>(body, label);
}
