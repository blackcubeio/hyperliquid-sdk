import type { Pair } from '../common/types';
import { PairConverter } from '../converters/pair';
import { getMeta } from './info/get-meta';
import { getMetaSpot } from './info/get-meta-spot';

/**
 * Toutes les paires au **format unifié** `Pair` (perp via `meta`, spot via `spotMeta`,
 * distinguées par `kind`). HL n'expose pas de `tickSize` plat (prix par chiffres
 * significatifs) ; le natif hors cœur est conservé dans `xtras`.
 */
export function getPairs(label?: string): Promise<Pair[]> {
  return Promise.all([getMeta(undefined, label), getMetaSpot(label)]).then(([meta, spot]) => {
    const converter = new PairConverter(spot.tokens);
    return [
      ...meta.universe.map((asset) => converter.toCommon(asset)),
      ...spot.universe.map((pair) => converter.toCommon(pair)),
    ];
  });
}
