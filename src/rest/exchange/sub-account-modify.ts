import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `subAccountModify` (renommer un sous-compte). */
export function buildSubAccountModifyAction(params: {
  subAccountUser: `0x${string}`;
  name: string;
}): Record<string, unknown> {
  return { type: 'subAccountModify', subAccountUser: params.subAccountUser, name: params.name };
}

/** Renomme un sous-compte (signé, `/exchange`). */
export function subAccountModify<TResponse = unknown>(
  client: HyperliquidClient,
  params: { subAccountUser: `0x${string}`; name: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildSubAccountModifyAction(params), label);
}
