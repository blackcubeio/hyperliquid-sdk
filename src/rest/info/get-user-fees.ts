import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Récapitulatif des frais d'un compte (taux maker/taker, remises, volume). */
export function getUserFees(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'userFees', user: params.user }, label);
}
