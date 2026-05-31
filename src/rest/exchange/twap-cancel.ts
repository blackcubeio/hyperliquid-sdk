import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `twapCancel`. */
export function buildTwapCancelAction(params: {
  asset: number;
  twapId: number;
}): Record<string, unknown> {
  return { type: 'twapCancel', a: params.asset, t: params.twapId };
}

/** Annule un ordre TWAP par son id (signé, `/exchange`). */
export function twapCancel<TResponse = unknown>(
  client: HyperliquidClient,
  params: { asset: number; twapId: number },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildTwapCancelAction(params), label);
}
