import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** État de parrainage d'un compte (code, parrain, filleuls, récompenses). */
export function getReferral(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'referral', user: params.user }, label);
}
