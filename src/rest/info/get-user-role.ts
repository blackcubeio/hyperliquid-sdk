import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Rôle d'un compte (`missing`/`user`/`agent`/`vault`/`subAccount`). */
export function getUserRole(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'userRole', user: params.user }, label);
}
