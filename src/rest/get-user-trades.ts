import type { JsonValue, UserTrade } from '../common/types';
import { infoRequest } from './client';
import { UserTradeConverter, type UserTradeNative } from '../converters/user-trade';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetUserTradesParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
  /** Filtre optionnel sur une paire (appliqué côté client). */
  name?: string;
}

/** Exécutions (fills) du compte au **format unifié** `UserTrade` (HL `userFills`). */
export function getUserTrades(params: GetUserTradesParams, label?: string): Promise<UserTrade[]> {
  const converter = new UserTradeConverter();
  const body: Record<string, JsonValue> = { type: 'userFills', user: params.user };
  return infoRequest<UserTradeNative[]>(body, label).then((wire) => {
    const trades = wire.map((entry) => converter.toCommon(entry));
    return params.name === undefined ? trades : trades.filter((t) => t.name === params.name);
  });
}
