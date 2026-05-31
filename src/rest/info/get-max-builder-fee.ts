import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Fee builder maximum approuvé par `user` pour l'adresse `builder` (en dixièmes de bps). */
export function getMaxBuilderFee(
  client: HyperliquidClient,
  params: { user: `0x${string}`; builder: `0x${string}` },
  label?: string,
): Promise<unknown> {
  return infoRequest<unknown>(
    client,
    { type: 'maxBuilderFee', user: params.user, builder: params.builder },
    label,
  );
}
