import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Fills des slices de TWAP d'un compte. */
export function getUserTwapSliceFills(
  client: HyperliquidClient,
  params: { user: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'userTwapSliceFills', user: params.user }, label);
}
