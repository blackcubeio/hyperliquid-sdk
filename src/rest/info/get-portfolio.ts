import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Portfolio d'un compte : séries de valeur de compte / PnL par fenêtre (day/week/month/allTime). */
export function getPortfolio(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'portfolio', user: params.user }, label);
}
