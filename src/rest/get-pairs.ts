import type { MarketKind, Pair } from '../common/types';
import type { AssetMeta } from './info/get-meta';
import { getMeta } from './info/get-meta';
import type { SpotPair, SpotToken } from './info/get-meta-spot';
import { getMetaSpot } from './info/get-meta-spot';

/** Pas de quantité dérivé des décimales de taille (`10^-d`). */
function stepFromDecimals(d: number): string {
  if (d <= 0) {
    return '1';
  }
  return `0.${'0'.repeat(d - 1)}1`;
}

// Perp HL : quote/collatéral en USDC ; pas de tickSize plat (prix par chiffres significatifs).
function perpToPair(asset: AssetMeta): Pair {
  return {
    name: asset.name,
    base: asset.name,
    quote: 'USDC',
    kind: 'perp',
    szDecimals: asset.szDecimals,
    maxLeverage: asset.maxLeverage,
    stepSize: stepFromDecimals(asset.szDecimals),
    status: asset.isDelisted === true ? 'DELISTED' : 'TRADING',
    raw: asset as unknown as Record<string, unknown>,
  };
}

function spotToPair(pair: SpotPair, tokens: SpotToken[]): Pair {
  const baseToken = tokens.find((token) => token.index === pair.tokens[0]);
  const quoteToken = tokens.find((token) => token.index === pair.tokens[1]);
  const szDecimals = baseToken?.szDecimals ?? 0;
  return {
    name: pair.name,
    base: baseToken?.name ?? String(pair.tokens[0]),
    quote: quoteToken?.name ?? String(pair.tokens[1]),
    kind: 'spot' as MarketKind,
    szDecimals,
    stepSize: stepFromDecimals(szDecimals),
    raw: pair as unknown as Record<string, unknown>,
  };
}

/**
 * Toutes les paires au **format unifié** `Pair` (perp via `meta`, spot via `spotMeta`,
 * distinguées par `kind`). HL n'expose pas de `tickSize` plat (prix par chiffres
 * significatifs) ; `raw` contient la meta d'origine complète.
 */
export function getPairs(label?: string): Promise<Pair[]> {
  return Promise.all([getMeta(undefined, label), getMetaSpot(label)]).then(([meta, spot]) => [
    ...meta.universe.map(perpToPair),
    ...spot.universe.map((pair) => spotToPair(pair, spot.tokens)),
  ]);
}
