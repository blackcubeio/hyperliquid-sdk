import type { HyperliquidClient } from '../common/config';
import type { GetPositionsParams } from '../common/types';
import type { Position } from '../common/types';
import { PositionConverter, type PositionNative } from '../converters/position';
import { getClearinghouseState } from './info/get-clearinghouse-state';

/** Positions ouvertes au **format unifié** `Position` (HL `clearinghouseState.assetPositions`). */
export function getPositions(
  client: HyperliquidClient,
  params: GetPositionsParams,
  label?: string,
): Promise<Position[]> {
  const converter = new PositionConverter();
  return getClearinghouseState(client, { user: params.user as `0x${string}` }, label).then(
    (state) => {
      const positions = state.assetPositions.map((entry) =>
        converter.toCommon(entry.position as PositionNative),
      );
      return params.name === undefined
        ? positions
        : positions.filter((position) => position.name === params.name);
    },
  );
}
