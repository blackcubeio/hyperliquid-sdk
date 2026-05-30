import type { SpotBalance, SpotClearinghouseState } from '../../common/types';
import { infoRequest } from '../client';

/**
 * Soldes **spot** d'un compte (par token : total, bloqué `hold`).
 * @param params `user` = adresse réelle du compte master/sub (jamais l'agent wallet).
 */
export function getClearinghouseStateSpot(
  params: { user: `0x${string}` },
  label?: string,
): Promise<SpotClearinghouseState> {
  return infoRequest<SpotClearinghouseState>(
    { type: 'spotClearinghouseState', user: params.user },
    label,
  );
}
