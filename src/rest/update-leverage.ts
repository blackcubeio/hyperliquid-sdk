import type { MarketKind } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildUpdateLeverageAction } from './exchange/update-leverage';
import { getMeta } from './info/get-meta';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface UpdateLeverageParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Levier cible (entier). */
  leverage: number;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Mode cross (`true`, défaut) ou isolé (`false`) — spécifique HL. */
  isCross?: boolean;
}

/** Confirmation unifiée d'un changement de levier. */
export interface LeverageUpdate {
  name: string;
  leverage: number;
  xtras?: Record<string, unknown>;
}

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
