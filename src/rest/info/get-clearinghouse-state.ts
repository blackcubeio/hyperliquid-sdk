import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

export interface MarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface PositionLeverage {
  type: string;
  value: number;
  rawUsd?: string;
}

export interface PositionCumFunding {
  allTime: string;
  sinceOpen: string;
  sinceChange: string;
}

export interface Position {
  coin: string;
  szi: string;
  entryPx?: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  leverage: PositionLeverage;
  liquidationPx: string | null;
  marginUsed: string;
  maxLeverage: number;
  cumFunding: PositionCumFunding;
}

export interface AssetPosition {
  type: string;
  position: Position;
}

export interface ClearinghouseState {
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
}

/**
 * État de marge perps d'un compte (valeur, marge utilisée, positions ouvertes).
 * @param params `user` = adresse réelle du compte master/sub (jamais l'adresse de l'agent wallet).
 */
export function getClearinghouseState(
  params: {
    user: `0x${string}`;
    dex?: string;
  },
  label?: string,
): Promise<ClearinghouseState> {
  const body: Record<string, JsonValue> = { type: 'clearinghouseState', user: params.user };
  if (params.dex !== undefined) {
    body.dex = params.dex;
  }
  return infoRequest<ClearinghouseState>(body, label);
}
