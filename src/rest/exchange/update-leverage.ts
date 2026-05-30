/** Paramètres de l'action L1 `updateLeverage` (asset = index HL). */
export interface LeverageActionParams {
  asset: number;
  /** `true` = cross, `false` = isolé. */
  isCross: boolean;
  leverage: number;
}

/** Construit l'action L1 `updateLeverage` (utilisée par le `updateLeverage` unifié). */
export function buildUpdateLeverageAction(params: LeverageActionParams): Record<string, unknown> {
  return {
    type: 'updateLeverage',
    asset: params.asset,
    isCross: params.isCross,
    leverage: params.leverage,
  };
}
