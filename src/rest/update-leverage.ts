import type { HyperliquidClient } from '../common/config';
import type { LeverageUpdate, UpdateLeverageParams } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildUpdateLeverageAction } from './exchange/update-leverage';
import { getMeta } from './info/get-meta';

/**
 * Met à jour le levier d'une coin (**écriture signée**, HL `/exchange`).
 * Résout `name` → asset index via `meta`. `isCross` défaut `true` (cross).
 */
export function updateLeverage(
  client: HyperliquidClient,
  params: UpdateLeverageParams,
  label: string,
): Promise<LeverageUpdate> {
  const isCross = params.isCross ?? true;
  return getMeta(client, undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action(
      client,
      buildUpdateLeverageAction({ asset, isCross, leverage: params.leverage }),
      label,
    ).then((response) => ({
      name: params.name,
      leverage: params.leverage,
      xtras: { isCross, response },
    }));
  });
}
