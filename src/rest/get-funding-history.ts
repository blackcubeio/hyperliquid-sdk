import type { FundingRate, JsonValue } from '../common/types';
import { infoRequest } from './client';
import { FundingConverter, type FundingRateNative } from '../converters/funding';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetFundingHistoryParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Début (ms) — requis par HL. */
  startTime: number;
  /** Fin (ms). */
  endTime?: number;
}

/** Historique du **taux de funding** au format unifié (HL `fundingHistory`). */
export function getFundingHistory(
  params: GetFundingHistoryParams,
  label?: string,
): Promise<FundingRate[]> {
  const body: Record<string, JsonValue> = {
    type: 'fundingHistory',
    coin: params.name,
    startTime: params.startTime,
  };
  if (params.endTime !== undefined) {
    body.endTime = params.endTime;
  }
  const converter = new FundingConverter();
  return infoRequest<FundingRateNative[]>(body, label).then((wire) =>
    wire.map((entry) => converter.toCommon(entry)),
  );
}
