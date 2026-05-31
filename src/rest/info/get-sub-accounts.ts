import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Liste des sous-comptes d'un compte master (nom, adresse, état de marge). */
export function getSubAccounts(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'subAccounts', user: params.user }, label);
}
