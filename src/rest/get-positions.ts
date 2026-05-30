import type { Position } from '../common/types';
import { PositionConverter, type PositionNative } from '../converters/position';
import { getClearinghouseState } from './info/get-clearinghouse-state';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetPositionsParams {
  /** Adresse réelle du compte (master/sub), **requise** côté HL. */
  user: string;
  /** Filtre optionnel sur une paire (appliqué côté client). */
  name?: string;
}

/** Positions ouvertes au **format unifié** `Position` (HL `clearinghouseState.assetPositions`). */
export function getPositions(params: GetPositionsParams, label?: string): Promise<Position[]> {
  const converter = new PositionConverter();
  return getClearinghouseState({ user: params.user as `0x${string}` }, label).then((state) => {
    const positions = state.assetPositions.map((entry) =>
      converter.toCommon(entry.position as PositionNative),
    );
    return params.name === undefined
      ? positions
      : positions.filter((position) => position.name === params.name);
  });
}
