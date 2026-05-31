import type { HyperliquidClient } from '../../common/config';
import { infoRequest } from '../client';

/** Liste des perp DEX (builder-deployed) disponibles. */
export function getPerpDexs(client: HyperliquidClient, label?: string): Promise<unknown> {
  return infoRequest<unknown>(client, { type: 'perpDexs' }, label);
}
