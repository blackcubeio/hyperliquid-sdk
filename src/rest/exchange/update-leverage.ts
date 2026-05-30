import type { LeverageActionParams } from '../../common/types';

/** Construit l'action L1 `updateLeverage` (utilisée par le `updateLeverage` unifié). */
export function buildUpdateLeverageAction(params: LeverageActionParams): Record<string, unknown> {
  return {
    type: 'updateLeverage',
    asset: params.asset,
    isCross: params.isCross,
    leverage: params.leverage,
  };
}
