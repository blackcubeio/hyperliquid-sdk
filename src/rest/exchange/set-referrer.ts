import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `setReferrer`. */
export function buildSetReferrerAction(code: string): Record<string, unknown> {
  return { type: 'setReferrer', code };
}

/** Définit le code de parrainage du compte (signé, `/exchange`). Action **une seule fois**. */
export function setReferrer<TResponse = unknown>(
  client: HyperliquidClient,
  params: { code: string },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(client, buildSetReferrerAction(params.code), label);
}
