import type { HyperliquidClient } from '../../common/config';
import type { JsonValue } from '../../common/types';
import { infoRequest } from '../client';

/** Détails d'un vault (équité, état, followers, performance). `user` optionnel = position du suiveur. */
export function getVaultDetails(
  client: HyperliquidClient,
  params: { vaultAddress: `0x${string}`; user?: `0x${string}` },
  label?: string,
): Promise<unknown> {
  const body: Record<string, JsonValue> = {
    type: 'vaultDetails',
    vaultAddress: params.vaultAddress,
  };
  if (params.user !== undefined) {
    body.user = params.user;
  }
  return infoRequest<unknown>(client, body, label);
}
