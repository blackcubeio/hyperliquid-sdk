import type { HyperliquidClient } from '../common/config';
import type { GetFundingHistoryParams } from '../common/types';
import type { FundingRate, JsonValue } from '../common/types';
import { FundingConverter, type FundingRateNative } from '../converters/funding';
import { infoRequest } from './client';

/** Historique du **taux de funding** au format unifié (HL `fundingHistory`). */
export function getFundingHistory(
  client: HyperliquidClient,
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
  return infoRequest<FundingRateNative[]>(client, body, label).then((wire) =>
    wire.map((entry) => converter.toCommon(entry)),
  );
}
