import type { LeverageUpdate, UpdateLeverageParams } from '../common/types';
import type { MarketKind } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildUpdateLeverageAction } from './exchange/update-leverage';
import { getMeta } from './info/get-meta';

/**
 * Met à jour le levier d'une coin (**écriture signée**, HL `/exchange`).
 * Résout `name` → asset index via `meta`. `isCross` défaut `true` (cross).
 */
export function updateLeverage(
  params: UpdateLeverageParams,
  label: string,
): Promise<LeverageUpdate> {
  const isCross = params.isCross ?? true;
  return getMeta(undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action(
      buildUpdateLeverageAction({ asset, isCross, leverage: params.leverage }),
      label,
    ).then((response) => ({
      name: params.name,
      leverage: params.leverage,
      xtras: { isCross, response },
    }));
  });
}
