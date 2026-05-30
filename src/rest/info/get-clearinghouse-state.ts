import type { HyperliquidClient } from '../../common/config';
import type { ClearinghouseState } from '../../common/types';
import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/**
 * État de marge perps d'un compte (valeur, marge utilisée, positions ouvertes).
 * @param params `user` = adresse réelle du compte master/sub (jamais l'adresse de l'agent wallet).
 */
export function getClearinghouseState(
  client: HyperliquidClient,
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
  return infoRequest<ClearinghouseState>(client, body, label);
}
